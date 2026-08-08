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


# ---------------------------------------------------------------- the write path
#
# This is the only code in the project that modifies a file shared with every
# other project the user opens. It was also the least covered, which is the
# wrong way round.


def _fake_binary(directory: Path, name: str) -> Path:
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / name
    path.write_text("#!/bin/sh\nexit 0\n", encoding="utf-8")
    path.chmod(0o755)
    return path


def test_entry_is_constructed_from_a_binary_on_path(tmp_path: Path, monkeypatch):
    bindir = tmp_path / "bin"
    _fake_binary(bindir, "context-mode")
    monkeypatch.setenv("PATH", str(bindir))
    _write_mcp(tmp_path / ".cursor" / "mcp.json", {})

    proposal = McpInstallerService(str(tmp_path), home=str(tmp_path / "home")).propose()
    entry = next(p for p in proposal["proposals"] if p["server"] == "context-mode")

    assert entry["confidence"] == "high"
    assert entry["entry"]["command"] == str(bindir / "context-mode")
    assert "PATH" in entry["basis"]


def test_apply_writes_the_entry_and_backs_the_file_up(tmp_path: Path, monkeypatch):
    bindir = tmp_path / "bin"
    _fake_binary(bindir, "context-mode")
    monkeypatch.setenv("PATH", str(bindir))
    config = tmp_path / ".cursor" / "mcp.json"
    _write_mcp(config, {"existing": {"command": "keep-me"}})

    result = McpInstallerService(str(tmp_path), home=str(tmp_path / "home")).install_missing(
        apply=True
    )

    assert result["applied"] is True
    written = json.loads(config.read_text())["mcpServers"]
    assert "context-mode" in written
    assert written["existing"]["command"] == "keep-me", "an unrelated server was lost"

    backup = json.loads(config.with_name("mcp.json.backup").read_text())["mcpServers"]
    assert "context-mode" not in backup, "the backup should predate the change"


def test_apply_never_overwrites_an_existing_entry(tmp_path: Path, monkeypatch):
    """The user's own launch command must win over anything inferred."""
    bindir = tmp_path / "bin"
    _fake_binary(bindir, "context-mode")
    monkeypatch.setenv("PATH", str(bindir))
    config = tmp_path / ".cursor" / "mcp.json"
    _write_mcp(config, {"context-mode": {"command": "my-own-wrapper", "args": ["x"]}})

    McpInstallerService(str(tmp_path), home=str(tmp_path / "home")).install_missing(apply=True)

    written = json.loads(config.read_text())["mcpServers"]
    assert written["context-mode"] == {"command": "my-own-wrapper", "args": ["x"]}


def test_apply_preserves_keys_outside_mcp_servers(tmp_path: Path, monkeypatch):
    bindir = tmp_path / "bin"
    _fake_binary(bindir, "context-mode")
    monkeypatch.setenv("PATH", str(bindir))
    config = tmp_path / ".cursor" / "mcp.json"
    config.parent.mkdir(parents=True)
    config.write_text(json.dumps({"mcpServers": {}, "someOtherSetting": {"a": 1}}))

    McpInstallerService(str(tmp_path), home=str(tmp_path / "home")).install_missing(apply=True)

    written = json.loads(config.read_text())
    assert written["someOtherSetting"] == {"a": 1}


def test_apply_leaves_editor_wide_config_alone_by_default(tmp_path: Path, monkeypatch):
    """Editor-wide config is shared by every project; project scope is the default."""
    bindir = tmp_path / "bin"
    _fake_binary(bindir, "context-mode")
    monkeypatch.setenv("PATH", str(bindir))
    home = tmp_path / "home"
    editor = home / ".cursor" / "mcp.json"
    _write_mcp(editor, {})
    before = editor.read_text()
    _write_mcp(tmp_path / ".cursor" / "mcp.json", {})

    McpInstallerService(str(tmp_path), home=str(home)).install_missing(apply=True)

    assert editor.read_text() == before


def test_apply_reports_when_nothing_could_be_constructed(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("PATH", str(tmp_path / "empty"))
    _write_mcp(tmp_path / ".cursor" / "mcp.json", {})

    result = McpInstallerService(str(tmp_path), home=str(tmp_path / "home")).install_missing(
        apply=True
    )

    assert result["applied"] is False
    assert result["skipped"]


def test_launch_style_is_learned_from_a_configured_companion(tmp_path: Path, monkeypatch):
    """Copying a working entry beats assuming a package manager."""
    monkeypatch.setenv("PATH", str(tmp_path / "empty"))
    _write_mcp(
        tmp_path / ".cursor" / "mcp.json",
        {"context-mode": {"command": "/opt/wrapper", "args": ["context-mode"]}},
    )

    proposal = McpInstallerService(str(tmp_path), home=str(tmp_path / "home")).propose()
    entry = next(p for p in proposal["proposals"] if p["server"] == "code-review-graph")

    assert entry["confidence"] == "low"
    assert entry["entry"] is None, "a guessed command is how the previous version broke things"
    assert "mirror that launch style" in entry["basis"]
