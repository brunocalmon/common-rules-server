"""Teaching the host editor how to drive this server.

An MCP server can only offer tools; it cannot make an agent use them well. What
closes that gap is a rules file in the place the editor already reads at the
start of every session.

Each editor keeps that file somewhere different, so this service detects which
editors a project uses and writes the same guidance into each one's native
location. The guidance itself never names an editor — it describes the server
and its companions, which is what makes the same text correct everywhere.

Writes are confined to a marked block, so re-running setup updates the guidance
in place instead of appending another copy, and anything the user wrote around
it survives.
"""

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

from common_rules_server.util import managed_blocks

#: Name of the block this service owns. Sync writes a differently named block to
#: the same files; sharing one name made the second write erase the first.
BLOCK_NAME = "guidance"
BLOCK_START = managed_blocks.start_marker(BLOCK_NAME)
BLOCK_END = managed_blocks.end_marker(BLOCK_NAME)


@dataclass(frozen=True)
class IdeTarget:
    key: str
    label: str
    #: Paths whose existence indicates this editor is in use for the project.
    markers: tuple[str, ...]
    #: Where the guidance file goes, relative to the project root.
    rules_path: str
    #: Frontmatter required by that editor, if any.
    frontmatter: Optional[str] = None


IDE_TARGETS: tuple[IdeTarget, ...] = (
    IdeTarget(
        key="cursor",
        label="Cursor",
        markers=(".cursor",),
        rules_path=".cursor/rules/common-rules-orchestrator.mdc",
        frontmatter=(
            "---\n"
            "description: How to drive the common-rules orchestration server\n"
            "alwaysApply: true\n"
            "---\n"
        ),
    ),
    IdeTarget(
        key="claude",
        label="Claude Code",
        markers=(".claude", "CLAUDE.md"),
        rules_path="CLAUDE.md",
    ),
    IdeTarget(
        key="windsurf",
        label="Windsurf",
        markers=(".windsurf", ".windsurfrules"),
        rules_path=".windsurf/rules/common-rules-orchestrator.md",
    ),
    IdeTarget(
        key="antigravity",
        label="Antigravity",
        # `.agents` is the documented customization root; the others are
        # editor state directories that also indicate it is in use.
        markers=(".agents", ".antigravity", ".gemini"),
        rules_path=".agents/rules/common-rules-orchestrator.md",
    ),
    IdeTarget(
        key="generic",
        label="AGENTS.md (editor-neutral)",
        markers=("AGENTS.md",),
        rules_path="AGENTS.md",
    ),
)


GUIDANCE = """# Orchestration via the common-rules server

This project is orchestrated by the `common-rules` MCP server. It holds the
rules, skills, agents, workflows and loops that describe how work is done here.
Prefer them over improvising a process of your own.

## Start of session

Call `get_context()` once. It returns the full map in a single call: resolved
project configuration, and every available resource with its description and
its relationships. It deliberately omits instruction bodies — read those on
demand.

If `env_status.needs_input` is non-empty, the project is not configured yet.
Run `setup_config()`, then ask the user for the values it could not determine
rather than guessing them.

## During work

Call `get_resource(kind, name)` for the one resource you need, when you need it.
The response carries the full instructions, the placeholders resolved from
project configuration, and the output template the report must follow.

Resources reference each other as `/name`. Each one states where it comes from,
where it goes next, and what it may invoke. Follow those edges — they encode the
process, and an edge marked required is not optional.

Always apply rules whose type is `Always`. Skills marked `model-invoked` are
yours to reach for when their description matches the task; skills marked
`user-invoked` wait to be asked for.

When a resource names an output template, produce your report in that shape.
Predictable output is the point.

## Companion servers

Two other MCP servers make this one substantially cheaper and sharper to run.
Use them when they are available:

- **code-review-graph** — a structural graph of the codebase. Reach for it
  before reading files at random: ask it for the impact radius of a change, the
  minimal context for a review, or where a symbol actually lives. It answers
  structural questions in one call that would otherwise cost many file reads.
- **context-mode** — indexed project memory. Search it before re-deriving
  something the project already established, and let it carry long-lived context
  between sessions instead of re-reading the repository each time.

If either is missing, `setup_config()` reports it along with how to install it.

## If this project has been synced

Running `sync_to_ide` writes every resource into this editor's own files. When
that has happened, the rules and skills beside this one *are* the kit, already
resolved — read them directly and do not call the server for the same content.

Both modes are equivalent in what they say. The server is authoritative and
always current; the synced files cost nothing to read but go stale until sync is
re-run. If the two disagree, the server is right and a sync is overdue.

## Standing obligations

Every resource carries a `self_check` list. Answer it before reporting work
done, and say plainly what you did not do. Close each response with the session
receipt, whose verification field must name something you observed.

Some automations run from the editor itself rather than from these instructions.
If one blocks an action, that is the system working as intended.

## Creating new resources

Use `create_resource(kind, name, description, body)`. It writes into this
project only — the server's built-in kit is never modified. A project resource
overrides a built-in one of the same kind and name, which is how you specialise
the default process without forking it.
"""


class IdeService:
    def __init__(self, project_root: Optional[str] = None):
        self.project_root = Path(project_root) if project_root else Path(os.getcwd())

    def detect(self) -> list[IdeTarget]:
        """Returns the editors this project shows evidence of using."""
        return [
            target
            for target in IDE_TARGETS
            if any((self.project_root / marker).exists() for marker in target.markers)
        ]

    def setup_ide_rules(self, targets: Optional[list[str]] = None) -> dict[str, Any]:
        """Writes orchestration guidance into each detected editor's rules file.

        When nothing is detected, no file is created and the caller is told to
        ask which editor is in use. Scattering rules files into a project on a
        guess is worse than asking one question.
        """
        selected = (
            [t for t in IDE_TARGETS if t.key in targets] if targets else self.detect()
        )

        result: dict[str, Any] = {
            "detected": [t.key for t in self.detect()],
            "written": [],
            "failed": [],
            "action_required": None,
        }

        if not selected:
            result["action_required"] = (
                "No editor detected. Ask the user which editor they use, then call "
                "setup_config again with that editor named, so the orchestration "
                "guidance lands where their agent will read it. Supported: "
                + ", ".join(t.key for t in IDE_TARGETS)
            )
            return result

        for target in selected:
            path = self.project_root / target.rules_path
            try:
                path.parent.mkdir(parents=True, exist_ok=True)
                existing = path.read_text(encoding="utf-8") if path.exists() else ""
                path.write_text(_merge_block(existing, GUIDANCE, target), encoding="utf-8")
                result["written"].append({"ide": target.key, "path": target.rules_path})
            except OSError as exc:
                result["failed"].append({"ide": target.key, "error": str(exc)})

        return result


def _merge_block(existing: str, guidance: str, target: IdeTarget) -> str:
    """Inserts or replaces the guidance block, leaving surrounding content alone."""
    return managed_blocks.merge(
        existing, guidance, BLOCK_NAME, prefix=target.frontmatter or ""
    )
