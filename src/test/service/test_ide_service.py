"""Editor guidance placement and idempotence."""

from pathlib import Path

from common_rules_server.service.ide_service import BLOCK_END, BLOCK_START, IdeService


def test_detects_cursor_from_its_directory(tmp_path: Path):
    (tmp_path / ".cursor").mkdir()
    assert [t.key for t in IdeService(str(tmp_path)).detect()] == ["cursor"]


def test_detects_claude_code_from_either_marker(tmp_path: Path):
    (tmp_path / "CLAUDE.md").write_text("# Project\n", encoding="utf-8")
    assert "claude" in [t.key for t in IdeService(str(tmp_path)).detect()]


def test_detects_several_editors_at_once(tmp_path: Path):
    (tmp_path / ".cursor").mkdir()
    (tmp_path / ".claude").mkdir()
    detected = [t.key for t in IdeService(str(tmp_path)).detect()]
    assert set(detected) == {"cursor", "claude"}


def test_writes_guidance_to_the_editors_own_location(tmp_path: Path):
    (tmp_path / ".cursor").mkdir()
    result = IdeService(str(tmp_path)).setup_ide_rules()

    assert result["written"][0]["path"] == ".cursor/rules/common-rules-orchestrator.mdc"
    written = (tmp_path / ".cursor/rules/common-rules-orchestrator.mdc").read_text(encoding="utf-8")
    assert written.startswith("---")  # Cursor needs its frontmatter
    assert BLOCK_START in written
    assert BLOCK_END in written


def test_guidance_teaches_the_tools_and_the_companions(tmp_path: Path):
    (tmp_path / ".cursor").mkdir()
    IdeService(str(tmp_path)).setup_ide_rules()
    written = (tmp_path / ".cursor/rules/common-rules-orchestrator.mdc").read_text(encoding="utf-8")

    for expected in ("get_context()", "get_resource(", "setup_config()", "code-review-graph", "context-mode"):
        assert expected in written


def test_guidance_names_no_editor(tmp_path: Path):
    """The same text is written everywhere, so it must be editor-neutral."""
    (tmp_path / ".cursor").mkdir()
    IdeService(str(tmp_path)).setup_ide_rules()
    body = (tmp_path / ".cursor/rules/common-rules-orchestrator.mdc").read_text(encoding="utf-8")
    block = body.split(BLOCK_START)[1].split(BLOCK_END)[0].lower()
    for editor in ("cursor", "antigravity", "windsurf", "claude code"):
        assert editor not in block


def test_guidance_covers_the_synced_mode(tmp_path: Path):
    """After a sync, telling the agent to call the server is wrong.

    Both routes deliver the same content; the guidance has to say which is
    authoritative when they disagree.
    """
    (tmp_path / ".cursor").mkdir()
    IdeService(str(tmp_path)).setup_ide_rules()
    written = " ".join(
        (tmp_path / ".cursor/rules/common-rules-orchestrator.mdc").read_text().split()
    )

    assert "synced" in written.lower()
    assert "the server is right and a sync is overdue" in written


def test_guidance_states_the_standing_obligations(tmp_path: Path):
    (tmp_path / ".cursor").mkdir()
    IdeService(str(tmp_path)).setup_ide_rules()
    # Collapse wrapping: the guidance is prose, so a phrase may straddle lines.
    written = " ".join(
        (tmp_path / ".cursor/rules/common-rules-orchestrator.mdc").read_text().split()
    )

    assert "self_check" in written
    assert "session receipt" in written.lower()
    assert "blocks an action" in written


def test_rerunning_replaces_the_block_rather_than_appending(tmp_path: Path):
    (tmp_path / ".cursor").mkdir()
    service = IdeService(str(tmp_path))
    service.setup_ide_rules()
    service.setup_ide_rules()
    service.setup_ide_rules()

    written = (tmp_path / ".cursor/rules/common-rules-orchestrator.mdc").read_text(encoding="utf-8")
    assert written.count(BLOCK_START) == 1
    assert written.count(BLOCK_END) == 1


def test_user_content_around_the_block_survives(tmp_path: Path):
    (tmp_path / ".claude").mkdir()
    target = tmp_path / "CLAUDE.md"
    target.write_text("# My project rules\n\nAlways use tabs.\n", encoding="utf-8")

    service = IdeService(str(tmp_path))
    service.setup_ide_rules()
    service.setup_ide_rules()

    written = target.read_text(encoding="utf-8")
    assert "Always use tabs." in written
    assert written.count(BLOCK_START) == 1


def test_no_editor_detected_asks_instead_of_guessing(tmp_path: Path):
    result = IdeService(str(tmp_path)).setup_ide_rules()
    assert result["written"] == []
    assert result["detected"] == []
    assert "Ask the user which editor" in result["action_required"]
    assert list(tmp_path.iterdir()) == []


def test_an_editor_can_be_named_explicitly(tmp_path: Path):
    result = IdeService(str(tmp_path)).setup_ide_rules(["claude"])
    assert result["written"][0]["path"] == "CLAUDE.md"
    assert (tmp_path / "CLAUDE.md").exists()
