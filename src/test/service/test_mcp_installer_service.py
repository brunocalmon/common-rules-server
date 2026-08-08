"""Companion server detection.

Editor-wide MCP configuration is shared by every project the user opens, so the
default posture is to report rather than write.
"""

import json
from pathlib import Path

from common_rules_server.service.mcp_installer_service import McpInstallerService


def _write_mcp(path: Path, servers: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"mcpServers": servers}, indent=2), encoding="utf-8")


def test_reports_both_companions_missing(tmp_path: Path):
    _write_mcp(tmp_path / ".cursor" / "mcp.json", {"something-else": {"command": "x"}})
    scan = McpInstallerService(str(tmp_path), home=str(tmp_path / "home")).scan()

    assert set(scan["companions_missing"]) == {"code-review-graph", "context-mode"}
    assert scan["companions_available"] == []


def test_recognises_an_installed_companion(tmp_path: Path):
    _write_mcp(tmp_path / ".cursor" / "mcp.json", {"context-mode": {"command": "ctx"}})
    scan = McpInstallerService(str(tmp_path), home=str(tmp_path / "home")).scan()

    assert scan["companions_available"] == ["context-mode"]
    assert scan["companions_missing"] == ["code-review-graph"]


def test_malformed_config_is_reported_not_crashed_on(tmp_path: Path):
    path = tmp_path / ".cursor" / "mcp.json"
    path.parent.mkdir(parents=True)
    path.write_text("{ not json", encoding="utf-8")

    scan = McpInstallerService(str(tmp_path), home=str(tmp_path / "home")).scan()
    assert scan["locations"][0]["readable"] is False


def test_nothing_is_written_without_consent(tmp_path: Path):
    config = tmp_path / ".cursor" / "mcp.json"
    _write_mcp(config, {})
    before = config.read_text(encoding="utf-8")

    result = McpInstallerService(str(tmp_path), home=str(tmp_path / "home")).install_missing(
        apply=False
    )

    assert result["applied"] is False
    assert config.read_text(encoding="utf-8") == before
    assert not config.with_name("mcp.json.backup").exists()


def test_proposal_explains_why_each_companion_matters(tmp_path: Path):
    _write_mcp(tmp_path / ".cursor" / "mcp.json", {})
    proposal = McpInstallerService(str(tmp_path), home=str(tmp_path / "home")).propose()

    servers = {p["server"] for p in proposal["proposals"]}
    assert servers == {"code-review-graph", "context-mode"}
    for entry in proposal["proposals"]:
        assert entry["purpose"]
        assert entry["used_by"]
        assert entry["confidence"] in ("high", "low", "unknown")


def test_proposal_admits_when_it_cannot_construct_an_entry(tmp_path: Path):
    """Inventing a launch command would break the user's editor everywhere."""
    _write_mcp(tmp_path / ".cursor" / "mcp.json", {})
    proposal = McpInstallerService(str(tmp_path), home=str(tmp_path / "home")).propose()
    for entry in proposal["proposals"]:
        if entry["confidence"] != "high":
            assert entry["entry"] is None
            assert entry["basis"]


def test_editor_wide_config_is_out_of_project_scope(tmp_path: Path):
    home = tmp_path / "home"
    editor_config = home / ".cursor" / "mcp.json"
    _write_mcp(editor_config, {})
    before = editor_config.read_text(encoding="utf-8")

    McpInstallerService(str(tmp_path), home=str(home)).install_missing(
        apply=True, scopes=("project",)
    )

    assert editor_config.read_text(encoding="utf-8") == before
