"""Companion MCP server detection.

The rules and skills in the default kit are written assuming two companion
servers are reachable: ``code-review-graph`` for structural questions about the
codebase, and ``context-mode`` for indexed project memory. Both cut token cost
sharply compared with reading files to rediscover the same facts.

This service finds the editor's MCP configuration, reports which companions are
present, and can add the missing ones.

Adding is off by default, and that is a deliberate choice rather than caution
for its own sake. An editor's MCP configuration is global: it is shared by every
project the user opens, and a wrong entry there breaks tools everywhere, not
just here. So the default behaviour is to report what is missing and how to
install it, and let the user decide. Turning on ``AUTO_INSTALL_MCPS`` opts into
writes, and even then the file is backed up first and existing entries are never
overwritten.
"""

import json
import os
import shutil
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

COMPANIONS = ("code-review-graph", "context-mode")

COMPANION_INFO: dict[str, dict[str, str]] = {
    "code-review-graph": {
        "purpose": (
            "Structural knowledge graph of the codebase. Answers impact radius, "
            "minimal review context and symbol location in one call instead of "
            "many file reads."
        ),
        "used_by": "/review, /architecture-compliance, /diagnose",
        "install_method": "uv tool install code-review-graph",
    },
    "context-mode": {
        "purpose": (
            "Indexed project memory. Carries established context between "
            "sessions so it does not have to be re-derived from the repository."
        ),
        "used_by": "/research, /grill-me, /dev-process",
        "install_method": "npm install -g context-mode",
    },
}


@dataclass(frozen=True)
class McpConfigLocation:
    key: str
    label: str
    path: Path
    #: Editor-level config is shared across projects; project-level is not.
    scope: str


@dataclass
class ScanResult:
    locations: list = field(default_factory=list)
    present: dict = field(default_factory=dict)
    missing: dict = field(default_factory=dict)


class McpInstallerService:
    def __init__(self, project_root: Optional[str] = None, home: Optional[str] = None):
        self.project_root = Path(project_root) if project_root else Path(os.getcwd())
        self.home = Path(home) if home else Path.home()

    # ------------------------------------------------------------ discovery

    def candidate_locations(self) -> list[McpConfigLocation]:
        candidates = [
            McpConfigLocation("cursor-project", "Cursor (project)", self.project_root / ".cursor" / "mcp.json", "project"),
            McpConfigLocation("claude-project", "Claude Code (project)", self.project_root / ".mcp.json", "project"),
            McpConfigLocation("vscode-project", "VS Code (project)", self.project_root / ".vscode" / "mcp.json", "project"),
            McpConfigLocation("cursor-user", "Cursor (editor-wide)", self.home / ".cursor" / "mcp.json", "editor"),
            McpConfigLocation("antigravity-user", "Antigravity (editor-wide)", self.home / ".gemini" / "config" / "mcp_config.json", "editor"),
            McpConfigLocation("windsurf-user", "Windsurf (editor-wide)", self.home / ".codeium" / "windsurf" / "mcp_config.json", "editor"),
            McpConfigLocation("claude-user", "Claude Code (editor-wide)", self.home / ".claude.json", "editor"),
        ]
        return [c for c in candidates if c.path.exists()]

    def scan(self) -> dict[str, Any]:
        """Reports companion status for every MCP config file found."""
        locations = []
        for location in self.candidate_locations():
            servers = _read_servers(location.path)
            if servers is None:
                locations.append(
                    {
                        "key": location.key,
                        "label": location.label,
                        "path": str(location.path),
                        "scope": location.scope,
                        "readable": False,
                    }
                )
                continue

            present = [name for name in COMPANIONS if name in servers]
            missing = [name for name in COMPANIONS if name not in servers]
            locations.append(
                {
                    "key": location.key,
                    "label": location.label,
                    "path": str(location.path),
                    "scope": location.scope,
                    "readable": True,
                    "present": present,
                    "missing": missing,
                    "server_count": len(servers),
                }
            )

        anywhere = set()
        for entry in locations:
            anywhere.update(entry.get("present", []))

        return {
            "locations": locations,
            "companions_available": sorted(anywhere),
            "companions_missing": sorted(set(COMPANIONS) - anywhere),
            "companion_info": COMPANION_INFO,
        }

    # ------------------------------------------------------------- proposal

    def _learn_launch_style(self) -> Optional[dict]:
        """Infers how this machine launches MCP servers from what it already runs.

        Copying the shape of a working entry is far more reliable than assuming a
        package manager. A machine that launches its servers through a wrapper
        binary will keep doing so.
        """
        for location in self.candidate_locations():
            servers = _read_servers(location.path) or {}
            for name in COMPANIONS:
                if name in servers and isinstance(servers[name], dict):
                    return {"source": str(location.path), "entry": servers[name]}
        return None

    def propose(self) -> dict[str, Any]:
        """Describes how to add each missing companion, without changing anything."""
        scan = self.scan()
        learned = self._learn_launch_style()
        proposals = []

        for name in scan["companions_missing"]:
            proposal: dict[str, Any] = {
                "server": name,
                "purpose": COMPANION_INFO[name]["purpose"],
                "used_by": COMPANION_INFO[name]["used_by"],
                "install_method": COMPANION_INFO[name]["install_method"],
            }
            on_path = shutil.which(name)
            if on_path:
                proposal["entry"] = {"command": on_path, "args": ["mcp"] if name == "code-review-graph" else []}
                proposal["confidence"] = "high"
                proposal["basis"] = f"executable found on PATH at {on_path}"
            elif learned:
                proposal["entry"] = None
                proposal["confidence"] = "low"
                proposal["basis"] = (
                    f"this machine launches MCP servers like the entry in {learned['source']}; "
                    "install the binary first, then mirror that launch style"
                )
            else:
                proposal["entry"] = None
                proposal["confidence"] = "unknown"
                proposal["basis"] = (
                    "no local installation found and no existing entry to copy; "
                    "ask the user how they install MCP servers"
                )
            proposals.append(proposal)

        return {
            "scan": scan,
            "proposals": proposals,
            "note": (
                "Nothing was written. Editor-wide MCP configuration is shared by "
                "every project, so it is only modified with explicit consent: set "
                "AUTO_INSTALL_MCPS=true in .common-rules-server/config.env, or add "
                "the entries by hand."
            ),
        }

    # ---------------------------------------------------------------- apply

    def install_missing(self, apply: bool = False, scopes: tuple = ("project",)) -> dict[str, Any]:
        """Adds missing companions to MCP configs whose scope is in ``scopes``.

        Only writes entries it can construct with high confidence, only into
        files that already exist, and never over an existing entry. The file is
        copied to ``<name>.backup`` first.
        """
        proposal = self.propose()
        result: dict[str, Any] = {
            "applied": False,
            "changes": [],
            "skipped": [],
            "proposals": proposal["proposals"],
        }

        actionable = [p for p in proposal["proposals"] if p.get("entry")]
        if not actionable:
            result["skipped"].append("No companion could be configured automatically.")
            return result

        if not apply:
            result["skipped"].append(
                "AUTO_INSTALL_MCPS is not enabled; reporting only. "
                + proposal["note"]
            )
            return result

        for location in self.candidate_locations():
            if location.scope not in scopes:
                continue
            servers = _read_servers(location.path)
            if servers is None:
                continue

            added = []
            for candidate in actionable:
                if candidate["server"] not in servers:
                    servers[candidate["server"]] = candidate["entry"]
                    added.append(candidate["server"])

            if not added:
                continue

            try:
                _write_servers(location.path, servers)
            except OSError as exc:
                result["skipped"].append(f"{location.path}: {exc}")
                continue

            result["applied"] = True
            result["changes"].append(
                {
                    "path": str(location.path),
                    "scope": location.scope,
                    "added": added,
                    "backup": f"{location.path}.backup",
                }
            )

        if not result["changes"]:
            result["skipped"].append(
                f"No MCP config file in scope {scopes} needed changes."
            )
        return result


def _read_servers(path: Path) -> Optional[dict]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if not isinstance(data, dict):
        return None
    servers = data.get("mcpServers")
    return servers if isinstance(servers, dict) else {}


def _write_servers(path: Path, servers: dict) -> None:
    """Rewrites the config, preserving every key other than ``mcpServers``."""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        data = {}
    if not isinstance(data, dict):
        data = {}

    shutil.copy2(path, path.with_name(path.name + ".backup"))
    data["mcpServers"] = servers
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
