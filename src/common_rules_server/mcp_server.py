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


async def _project_root_from_ctx(ctx: Context) -> str:
    """Resolve the project root, preferring MCP roots over os.getcwd().

    When the server runs as a global MCP server (e.g. via Claude Desktop),
    its process CWD is typically the user's home directory — not the project.
    The MCP ``roots`` capability communicates the actual project directory
    from the client, which is what we need.
    """
    explicit = os.environ.get("COMMON_RULES_PROJECT_ROOT") or os.environ.get(
        "CLAUDE_PROJECT_DIR"
    )
    if explicit:
        return explicit
    try:
        result = await ctx.session.list_roots()
        if result.roots:
            uri = str(result.roots[0].uri)
            parsed = urlparse(uri)
            if parsed.scheme == "file":
                return unquote(parsed.path)
    except Exception:
        logger.debug("Could not read MCP roots, falling back to cwd")
    return os.getcwd()


_ENTRYPOINT_TO_IDE: dict[str, str] = {
    "cli": "claude",
    "claude-desktop": "claude",
    "claude-code": "claude",
    "cursor": "cursor",
    "windsurf": "windsurf",
    "antigravity": "antigravity",
}


def _active_ide_from_env() -> Optional[str]:
    """Identify the active IDE from well-known environment variables.

    Claude Code sets ``CLAUDE_CODE_ENTRYPOINT``; other editors set their own.
    When one of these is present, we know which IDE is hosting this session
    and should target only that one — not every editor whose config files
    happen to exist on disk.
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
async def get_context(ctx: Context) -> dict:
    """Map every available rule, skill, agent, workflow and loop in one call.

    Call this once at the start of a session. Returns resolved project
    configuration plus each resource's name, description, relationships and
    required configuration keys — but not instruction bodies, which are fetched
    with get_resource when they are actually needed.

    Check env_status.needs_input: if it is non-empty the project has not been
    configured, and setup_config should run first.
    """
    root = await _project_root_from_ctx(ctx)
    return _resources(root).get_context()


@mcp.tool()
async def get_resource(kind: str, name: str, ctx: Context) -> dict:
    """Read one resource in full.

    kind is one of: rule, skill, agent, workflow, loop.
    name is the resource's kebab-case name, without the leading slash.

    Returns the instructions with project configuration substituted in, the
    output template the resulting report should follow, and which configuration
    keys were resolved or are still missing.
    """
    root = await _project_root_from_ctx(ctx)
    return _resources(root).get_resource(kind, name)


@mcp.tool()
async def create_resource(
    kind: str,
    name: str,
    description: str,
    body: str,
    ctx: Context,
    extra_fields: Optional[dict] = None,
) -> dict:
    """Create a project-scoped resource.

    Writes to the project's resources directory only; the built-in kit is never
    modified. A project resource shadows a built-in one of the same kind and
    name, which is how a project specialises the default process.

    body is Markdown holding the instructions. extra_fields may carry
    kind-specific frontmatter such as relationships, phases, trigger or type.
    """
    root = await _project_root_from_ctx(ctx)
    return _resources(root).create_resource(kind, name, description, body, extra_fields)


@mcp.tool()
async def setup_config(
    ctx: Context, ide: Optional[str] = None, install_companions: bool = False
) -> dict:
    """Configure this project and the surroundings the agent works in.

    Writes .common-rules-server/config.env with every setting the server
    understands, each one explained, auto-detecting what it can. Then installs
    the commit-message hook that keeps AI trailers out of commit authorship, and
    writes orchestration guidance into the detected editor's rules file.

    Safe to re-run: values already set are preserved, and the guidance block is
    replaced in place rather than duplicated.

    ide optionally names the editor when detection fails: cursor, claude,
    windsurf, antigravity or generic. install_companions permits writing
    companion MCP servers into editor configuration, which otherwise is only
    reported on.

    Read next_steps in the response — it lists what still needs a human answer.
    """
    root = await _project_root_from_ctx(ctx)
    config_service = ConfigService(root)

    resolved = config_service.write_config()
    config = resolved["config"]

    git_hooks = GitHookService(root).setup_hooks(config)

    ide_service = IdeService(root)
    active_ide = ide or _active_ide_from_env()
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
async def get_bdd_scenario(ctx: Context, page: int = 1) -> dict:
    """Read one acceptance scenario from the project's Gherkin feature file.

    Scenarios are served one per page so each is actually carried out rather
    than skimmed. Each page is self-contained: the feature description and
    Background travel with every scenario.

    Execute the scenario for real — call the tools its steps describe and
    compare what comes back against what it says should come back — then call
    this again with page + 1. Keep going while has_next is true.
    """
    root = await _project_root_from_ctx(ctx)
    config = ConfigService(root).get_config()["config"]
    return BddService(root, config.get("BDD_FILE_PATH")).get_scenario(page)


@mcp.tool()
async def sync_to_ide(
    ctx: Context,
    ides: Optional[list] = None,
    include_hooks: bool = True,
    clean: bool = False,
    offline: bool = False,
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
    """
    root = await _project_root_from_ctx(ctx)
    service = SyncService(_resources(root), root)

    if clean:
        return service.clean(ides)

    targets = ides or [t.key for t in IdeService(root).detect()]
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
