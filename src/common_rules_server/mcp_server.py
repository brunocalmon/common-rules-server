"""MCP entry point.

Five tools, shaped around how an agent actually works rather than around the
storage underneath:

* ``get_context``      — one call, the whole map, no instruction bodies
* ``get_resource``     — the full instructions for one resource, on demand
* ``create_resource``  — add a project-scoped resource
* ``setup_config``     — configure the project and its surroundings
* ``get_bdd_scenario`` — walk the acceptance scenarios one at a time
* ``sync_to_ide``       — export the whole kit into native editor files

Services are constructed per call rather than at import. The working directory
and the project's configuration can both change while the server is running, and
a service captured at import time would keep answering with the state that
existed when the process started.
"""

import json
import logging
import os
import sys
from pathlib import Path
from typing import Any, Optional
from urllib.parse import unquote, urlparse

from mcp.server.fastmcp import Context, FastMCP

from common_rules_server.service.bdd_service import BddService
from common_rules_server.service.config_service import ConfigService
from common_rules_server.service.git_hook_service import GitHookService
from common_rules_server.service.hook_service import HookService
from common_rules_server.service.ide_service import IdeService
from common_rules_server.service.mcp_installer_service import McpInstallerService
from common_rules_server.service.resource_service import ResourceService
from common_rules_server.service.sync_service import SyncService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stderr)],
)
logger = logging.getLogger("common-rules")

mcp = FastMCP("common-rules")


def _project_root() -> str:
    """The project being worked on, from environment variables only.

    ``COMMON_RULES_PROJECT_ROOT`` wins when set explicitly, which is what makes
    the server testable and usable from a host that launches it outside the
    project. ``CLAUDE_PROJECT_DIR`` is set by Claude Code for every MCP server
    it launches and is the correct project root when the server runs globally
    through a proxy wrapper whose cwd is the user's home directory.
    """
    return (
        os.environ.get("COMMON_RULES_PROJECT_ROOT")
        or os.environ.get("CLAUDE_PROJECT_DIR")
        or os.getcwd()
    )


# Deliberately excludes .common-rules-server: this server creates that
# directory, so treating it as evidence would let one bad guess justify itself
# forever afterwards.
PROJECT_MARKERS = (
    ".git",
    "pyproject.toml",
    "package.json",
    "go.mod",
    "Cargo.toml",
    "pom.xml",
    "build.gradle",
    "build.gradle.kts",
    "Gemfile",
    "composer.json",
)


def _looks_like_a_project(path: str) -> bool:
    """Whether this directory is plausibly the root of a codebase.

    A home directory, a container mount point or a folder that merely *holds*
    projects has none of these markers. Writing configuration into one of those
    is always a mistake, so the guess that produced it must not be trusted.
    """
    base = Path(path)
    return base.is_dir() and any((base / marker).exists() for marker in PROJECT_MARKERS)


def _nearest_project_above(path: str) -> Optional[str]:
    """Walk up from path looking for the first directory that holds a project."""
    current = Path(path).resolve()
    for candidate in (current, *current.parents):
        if _looks_like_a_project(str(candidate)):
            return str(candidate)
    return None


async def _roots_from_client(ctx: Context) -> list[str]:
    """Every filesystem root the client advertises, in the order it sent them.

    The client is not obliged to support roots at all, and when it does the
    first root is not necessarily the project being worked on — Claude Desktop
    advertises the folder that *contains* the user's projects. So this returns
    all of them and lets the caller choose.
    """
    try:
        result = await ctx.session.list_roots()
    except Exception as exc:  # noqa: BLE001 - the client may not support roots
        logger.info("client did not answer roots/list (%s)", exc)
        return []

    paths: list[str] = []
    for root in result.roots:
        parsed = urlparse(str(root.uri))
        if parsed.scheme == "file":
            paths.append(unquote(parsed.path))
    return paths


async def _resolve_root(ctx: Context, project_root: Optional[str] = None) -> dict:
    """Work out which project this call is about, and how confident we are.

    Returns the resolved path plus the evidence behind it. Callers that write
    to disk must check ``trusted`` — a guess that landed on a directory with no
    project markers is how configuration ends up in a home directory.

    The order is deliberate: what the caller stated, then what the host process
    was told, then what the client advertises, then the process's own working
    directory. Everything below the first two is a guess and is labelled as one.
    """
    if project_root:
        resolved = str(Path(project_root).expanduser().resolve())
        return {
            "root": resolved,
            "source": "argument",
            "trusted": True,
            "candidates": [resolved],
        }

    for var in ("COMMON_RULES_PROJECT_ROOT", "CLAUDE_PROJECT_DIR"):
        value = os.environ.get(var)
        if value:
            resolved = str(Path(value).expanduser().resolve())
            return {
                "root": resolved,
                "source": f"env:{var}",
                "trusted": True,
                "candidates": [resolved],
            }

    candidates = await _roots_from_client(ctx)
    for candidate in candidates:
        if _looks_like_a_project(candidate):
            return {
                "root": str(Path(candidate).resolve()),
                "source": "mcp-roots",
                "trusted": True,
                "candidates": candidates,
            }

    cwd = os.getcwd()
    nearest = _nearest_project_above(cwd)
    if nearest:
        return {
            "root": nearest,
            "source": "cwd-walk-up",
            "trusted": True,
            "candidates": candidates or [cwd],
        }

    fallback = candidates[0] if candidates else cwd
    return {
        "root": str(Path(fallback).resolve()),
        "source": "mcp-roots-unverified" if candidates else "cwd",
        "trusted": False,
        "candidates": candidates or [cwd],
    }


def _untrusted_root_error(resolution: dict) -> dict:
    """The refusal returned instead of writing into a directory we guessed."""
    return {
        "error": "project_root_unresolved",
        "project_root": resolution["root"],
        "project_root_source": resolution["source"],
        "candidates": resolution["candidates"],
        "message": (
            f"Refusing to write: {resolution['root']} has none of the markers of a "
            f"project ({', '.join(PROJECT_MARKERS[:4])}, ...), and it was reached by "
            f"guessing ({resolution['source']}) rather than being told. This server "
            "runs outside the project, so it cannot see the working directory of the "
            "agent that called it."
        ),
        "action_required": (
            "Call this tool again with project_root set to the absolute path of the "
            "project you are working in."
        ),
    }


_CLIENT_TO_IDE: tuple[tuple[str, str], ...] = (
    ("claude", "claude"),
    ("cursor", "cursor"),
    ("windsurf", "windsurf"),
    ("antigravity", "antigravity"),
)

_ENTRYPOINT_TO_IDE: dict[str, str] = {
    "cli": "claude",
    "claude-desktop": "claude",
    "claude-code": "claude",
    "cursor": "cursor",
    "windsurf": "windsurf",
    "antigravity": "antigravity",
}


def _active_ide_from_client(ctx: Context) -> Optional[str]:
    """Identify the editor from the MCP handshake rather than the environment.

    ``clientInfo`` travels over the protocol, so it survives the server being
    launched by a desktop application that exports none of the editor's
    environment variables — which is the normal case for a globally installed
    server.
    """
    try:
        raw = ctx.session.client_params.clientInfo.name
    except Exception:  # noqa: BLE001 - client_params is unset before initialize
        return None
    if not isinstance(raw, str):
        return None
    name = raw.strip().lower()
    for needle, ide in _CLIENT_TO_IDE:
        if needle in name:
            return ide
    return None


def _active_ide_from_env() -> Optional[str]:
    """Identify the active IDE from well-known environment variables.

    Only useful when the editor launched this server itself; a server started by
    a desktop application inherits none of these.
    """
    entrypoint = os.environ.get("CLAUDE_CODE_ENTRYPOINT", "").strip().lower()
    if entrypoint and entrypoint in _ENTRYPOINT_TO_IDE:
        return _ENTRYPOINT_TO_IDE[entrypoint]
    if os.environ.get("CURSOR_SESSION_ID"):
        return "cursor"
    if os.environ.get("WINDSURF_SESSION_ID"):
        return "windsurf"
    return None


def _resources(root: Optional[str] = None) -> ResourceService:
    return ResourceService(ConfigService(root or _project_root()))


@mcp.tool()
async def get_context(ctx: Context, project_root: Optional[str] = None) -> dict:
    """Map every available rule, skill, agent, workflow and loop in one call.

    Call this once at the start of a session. Returns resolved project
    configuration plus each resource's name, description, relationships and
    required configuration keys — but not instruction bodies, which are fetched
    with get_resource when they are actually needed.

    project_root is the absolute path of the project you are working in. This
    server usually runs outside that project and cannot see your working
    directory, so pass it whenever you know it.

    Check project_root in the response: if it is not the project you are working
    in, everything else in the answer describes the wrong directory. Then check
    env_status.needs_input — if it is non-empty, setup_config should run first.
    """
    resolution = await _resolve_root(ctx, project_root)
    result = _resources(resolution["root"]).get_context()
    result["project_root"] = resolution["root"]
    result["project_root_source"] = resolution["source"]
    if not resolution["trusted"]:
        result["project_root_warning"] = _untrusted_root_error(resolution)["message"]
    return result


@mcp.tool()
async def get_resource(
    kind: str, name: str, ctx: Context, project_root: Optional[str] = None
) -> dict:
    """Read one resource in full.

    kind is one of: rule, skill, agent, workflow, loop.
    name is the resource's kebab-case name, without the leading slash.

    Returns the instructions with project configuration substituted in, the
    output template the resulting report should follow, and which configuration
    keys were resolved or are still missing.
    """
    resolution = await _resolve_root(ctx, project_root)
    return _resources(resolution["root"]).get_resource(kind, name)


@mcp.tool()
async def create_resource(
    kind: str,
    name: str,
    description: str,
    body: str,
    ctx: Context,
    extra_fields: Optional[dict] = None,
    project_root: Optional[str] = None,
) -> dict:
    """Create a project-scoped resource.

    Writes to the project's resources directory only; the built-in kit is never
    modified. A project resource shadows a built-in one of the same kind and
    name, which is how a project specialises the default process.

    body is Markdown holding the instructions. extra_fields may carry
    kind-specific frontmatter such as relationships, phases, trigger or type.
    """
    resolution = await _resolve_root(ctx, project_root)
    if not resolution["trusted"]:
        return _untrusted_root_error(resolution)
    return _resources(resolution["root"]).create_resource(
        kind, name, description, body, extra_fields
    )


@mcp.tool()
async def setup_config(
    ctx: Context,
    ide: Optional[str] = None,
    install_companions: bool = False,
    project_root: Optional[str] = None,
) -> dict:
    """Configure this project and the surroundings the agent works in.

    Writes .common-rules-server/config.env with every setting the server
    understands, each one explained, auto-detecting what it can. Then installs
    the commit-message hook that keeps AI trailers out of commit authorship, and
    writes orchestration guidance into the detected editor's rules file.

    Safe to re-run: values already set are preserved, and the guidance block is
    replaced in place rather than duplicated.

    project_root is the absolute path of the project to configure. This server
    usually runs outside that project and cannot see your working directory, so
    pass it — without it the call is refused rather than writing somewhere it
    guessed.

    ide optionally names the editor when detection fails: cursor, claude,
    windsurf, antigravity or generic. install_companions permits writing
    companion MCP servers into editor configuration, which otherwise is only
    reported on.

    Read next_steps in the response — it lists what still needs a human answer.
    """
    resolution = await _resolve_root(ctx, project_root)
    if not resolution["trusted"]:
        return _untrusted_root_error(resolution)

    root = resolution["root"]
    config_service = ConfigService(root)

    resolved = config_service.write_config()
    config = resolved["config"]

    git_hooks = GitHookService(root).setup_hooks(config)

    ide_service = IdeService(root)
    active_ide = ide or _active_ide_from_env() or _active_ide_from_client(ctx)
    ide_rules = ide_service.setup_ide_rules([active_ide] if active_ide else None)

    detected = [active_ide] if active_ide else [t.key for t in ide_service.detect()]
    resources = ResourceService(config_service)
    editor_hooks = (
        HookService(root).install(resources.hooks(), detected) if detected else None
    )

    installer = McpInstallerService(root)
    auto_install = str(config.get("AUTO_INSTALL_MCPS", "false")).strip().lower() in (
        "true",
        "1",
        "yes",
        "on",
    )
    companions = installer.install_missing(apply=install_companions or auto_install)

    next_steps: list[str] = []
    for key in resolved["env_status"]["needs_input"]:
        next_steps.append(
            f"Ask the user for {key}, then write it into {resolved['env_status']['file_path']}."
        )
    if ide_rules.get("action_required"):
        next_steps.append(ide_rules["action_required"])
    for missing in companions["proposals"]:
        next_steps.append(
            f"Companion MCP server '{missing['server']}' is not configured. {missing['purpose']}"
        )

    if editor_hooks is None:
        next_steps.append(
            "No editor detected, so no lifecycle hooks were installed. Name the "
            "editor to setup_config to install them."
        )
    else:
        for gap in editor_hooks["unsupported"]:
            next_steps.append(
                f"Hook '{gap['hook']}' has no equivalent in {gap['ide']}; "
                f"that automation is unavailable there."
            )

    sync_result = SyncService(resources, root).sync(detected)

    return {
        "project_root": root,
        "project_root_source": resolution["source"],
        "config": config,
        "env_status": resolved["env_status"],
        "git_hooks": git_hooks,
        "editor_hooks": editor_hooks,
        "ide_rules": ide_rules,
        "companions": companions,
        "sync": sync_result,
        "next_steps": next_steps,
        "message": (
            "Project configured. "
            + (
                f"{len(next_steps)} item(s) need attention — see next_steps."
                if next_steps
                else "Nothing further is needed."
            )
        ),
    }


@mcp.tool()
async def get_bdd_scenario(
    ctx: Context, page: int = 1, project_root: Optional[str] = None
) -> dict:
    """Read one acceptance scenario from the project's Gherkin feature file.

    Scenarios are served one per page so each is actually carried out rather
    than skimmed. Each page is self-contained: the feature description and
    Background travel with every scenario.

    Execute the scenario for real — call the tools its steps describe and
    compare what comes back against what it says should come back — then call
    this again with page + 1. Keep going while has_next is true.
    """
    resolution = await _resolve_root(ctx, project_root)
    root = resolution["root"]
    config = ConfigService(root).get_config()["config"]
    return BddService(root, config.get("BDD_FILE_PATH")).get_scenario(page)


@mcp.tool()
async def sync_to_ide(
    ctx: Context,
    ides: Optional[list] = None,
    include_hooks: bool = True,
    clean: bool = False,
    offline: bool = False,
    project_root: Optional[str] = None,
) -> dict:
    """Export every resource into the editor's own native files.

    Writes rules, skills, agents, workflows, loops and lifecycle hooks into the
    layout each editor reads directly, so the kit keeps working without this
    server running and costs nothing per use at run time.

    ides selects targets: cursor, claude, antigravity. Omit to sync every editor
    detected in the project. clean removes previously generated files instead of
    writing them.

    The export is mechanical, so it is cheap to re-run — and it must be re-run
    after changing a resource, since generated files are overwritten rather than
    merged.

    project_root is the absolute path of the project to sync into. This server
    usually runs outside that project and cannot see your working directory, so
    pass it — without it the call is refused rather than writing somewhere it
    guessed.
    """
    resolution = await _resolve_root(ctx, project_root)
    if not resolution["trusted"]:
        return _untrusted_root_error(resolution)

    root = resolution["root"]
    service = SyncService(_resources(root), root)

    if clean:
        return service.clean(ides)

    active_ide = _active_ide_from_env() or _active_ide_from_client(ctx)
    targets = ides or ([active_ide] if active_ide else None)
    targets = targets or [t.key for t in IdeService(root).detect()]
    if not targets:
        return {
            "synced": [],
            "action_required": (
                "No editor detected. Pass ides explicitly — cursor, claude or "
                "antigravity — or run setup_config first."
            ),
        }
    return service.sync(targets, include_hooks=include_hooks, offline=offline)


def main() -> None:
    if len(sys.argv) > 1 and sys.argv[1] == "sync":
        clean = "--clean" in sys.argv
        offline = "--offline" in sys.argv
        ides = [a for a in sys.argv[2:] if not a.startswith("-")]
        root = _project_root()
        service = SyncService(_resources(), root)
        if clean:
            result = service.clean(ides or None)
        else:
            result = service.sync(ides or None, include_hooks=True, offline=offline)
        print(json.dumps(result, indent=2))
        return

    logger.info("common-rules orchestration server starting")
    logger.info("project root: %s", _project_root())
    logger.info(
        "tools: get_context, get_resource, create_resource, setup_config, "
        "get_bdd_scenario, sync_to_ide"
    )
    mcp.run()


if __name__ == "__main__":
    main()
