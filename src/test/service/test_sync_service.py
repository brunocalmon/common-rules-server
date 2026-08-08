"""Native export.

Sync is what lets the kit work with the server switched off, so these check the
output against each vendor's documented layout rather than against our own.
"""

from pathlib import Path

import pytest

from common_rules_server.service.sync_service import (
    BLOCK_START,
    GENERATED_HEADER,
    SyncService,
)


@pytest.fixture
def sync(resources, python_project: Path) -> SyncService:
    return SyncService(resources, str(python_project))


# ------------------------------------------------------------------ layout


def test_cursor_layout_matches_the_documented_paths(sync, python_project: Path):
    sync.sync(["cursor"], include_hooks=False)

    assert (python_project / ".cursor/rules/general.mdc").exists()
    assert (python_project / ".cursor/skills/tdd/SKILL.md").exists()
    assert (python_project / ".cursor/agents/reviewer.md").exists()


def test_claude_layout_matches_the_documented_paths(sync, python_project: Path):
    sync.sync(["claude"], include_hooks=False)

    assert (python_project / ".claude/skills/tdd/SKILL.md").exists()
    assert (python_project / ".claude/agents/reviewer.md").exists()
    assert (python_project / "CLAUDE.md").exists()


def test_antigravity_layout_matches_the_documented_paths(sync, python_project: Path):
    sync.sync(["antigravity"], include_hooks=False)

    assert (python_project / ".agents/skills/tdd/SKILL.md").exists()
    assert (python_project / "AGENTS.md").exists()


def test_workflows_and_loops_become_skills(sync, python_project: Path):
    """No editor models these separately, and both are invocable procedures."""
    sync.sync(["cursor"], include_hooks=False)
    assert (python_project / ".cursor/skills/feature-dev/SKILL.md").exists()
    assert (python_project / ".cursor/skills/pr-babysit/SKILL.md").exists()


def test_everything_loadable_is_exported(sync, resources, python_project: Path):
    """1:1 — nothing in the catalogue is left behind."""
    result = sync.sync(["cursor"], include_hooks=False)
    catalogue = resources.load()["resources"]
    non_hook = [r for r in catalogue.values() if r["kind"] != "hook"]

    assert result["synced"][0]["files_written"] == len(non_hook)

    # Rules and agents are single files named after the resource; skills are a
    # directory containing SKILL.md, so the name is the parent directory.
    exported = {
        Path(p).parent.name if Path(p).name == "SKILL.md" else Path(p).stem
        for p in result["synced"][0]["paths"]
    }
    for record in non_hook:
        assert record["name"] in exported, f"{record['kind']}:{record['name']} not exported"


# ------------------------------------------------------------- frontmatter


def test_cursor_rule_frontmatter_is_valid(sync, python_project: Path):
    sync.sync(["cursor"], include_hooks=False)
    text = (python_project / ".cursor/rules/general.mdc").read_text()

    assert text.startswith("---\n")
    assert "description:" in text
    assert "alwaysApply: true" in text  # general is an Always rule


def test_skill_frontmatter_carries_name_and_description(sync, python_project: Path):
    sync.sync(["claude"], include_hooks=False)
    text = (python_project / ".claude/skills/tdd/SKILL.md").read_text()

    assert text.startswith("---\n")
    assert "name: tdd" in text
    assert "description:" in text


def test_user_invoked_skills_opt_out_of_automatic_invocation(sync, python_project: Path):
    """Claude documents disable-model-invocation for exactly this."""
    sync.sync(["claude"], include_hooks=False)
    manual = (python_project / ".claude/skills/to-spec/SKILL.md").read_text()
    automatic = (python_project / ".claude/skills/tdd/SKILL.md").read_text()

    assert "disable-model-invocation: true" in manual
    assert "disable-model-invocation" not in automatic


def test_description_is_collapsed_to_one_line(sync, python_project: Path):
    """A folded YAML description would break single-line frontmatter."""
    sync.sync(["claude"], include_hooks=False)
    for line in (python_project / ".claude/skills/tdd/SKILL.md").read_text().splitlines():
        if line.startswith("description:"):
            assert ">" not in line and "|" not in line
            break


def test_agent_body_carries_persona_and_constraints(sync, python_project: Path):
    sync.sync(["claude"], include_hooks=False)
    text = (python_project / ".claude/agents/reviewer.md").read_text()

    assert "finds defects that matter" in text
    assert "Constraints:" in text
    assert "never modify code" in text.lower()


# -------------------------------------------------------------- self-check


def test_self_check_travels_into_every_export(sync, python_project: Path):
    """The questionnaire is the part most easily lost in translation."""
    sync.sync(["cursor", "claude", "antigravity"], include_hooks=False)

    for path in (
        ".cursor/skills/tdd/SKILL.md",
        ".claude/skills/tdd/SKILL.md",
        ".agents/skills/tdd/SKILL.md",
    ):
        text = (python_project / path).read_text()
        assert "## Self-check" in text, path
        assert "watch each test fail" in text, path


def test_output_template_is_inlined_not_merely_named(sync, python_project: Path):
    """Natively there is no templates directory to fetch from.

    A synced skill that only names its template leaves the agent with an
    instruction to produce a shape it cannot see, and predictable output was the
    entire point of having templates.
    """
    sync.sync(["cursor"], include_hooks=False)
    text = (python_project / ".cursor/skills/tdd/SKILL.md").read_text()

    assert "## Report format" in text
    assert "# TDD Cycle" in text
    assert "{{CYCLE_COUNT}}" in text


def test_every_resource_with_an_output_carries_its_shape(sync, resources, python_project: Path):
    sync.sync(["cursor"], include_hooks=False)

    expected = [
        r for r in resources.load()["resources"].values()
        if (r.get("relationships") or {}).get("output") and r["kind"] != "hook"
    ]
    carried = [
        p for p in (python_project / ".cursor").rglob("*.md*")
        if "Report format" in p.read_text()
    ]
    assert len(carried) == len(expected)


def test_workflow_phases_are_rendered(sync, python_project: Path):
    sync.sync(["cursor"], include_hooks=False)
    text = (python_project / ".cursor/skills/feature-dev/SKILL.md").read_text()
    assert "## Phases" in text
    assert "/grill-me" in text


# ------------------------------------------------------------- always file


def test_always_rules_land_in_the_file_the_editor_always_reads(sync, python_project: Path):
    sync.sync(["claude"], include_hooks=False)
    text = (python_project / "CLAUDE.md").read_text()

    for rule in ("general", "orchestrator", "self-review", "session-receipt"):
        assert f"## {rule}" in text


def test_user_content_in_the_always_file_survives(sync, python_project: Path):
    target = python_project / "CLAUDE.md"
    target.write_text("# My rules\n\nAlways use tabs.\n", encoding="utf-8")

    sync.sync(["claude"], include_hooks=False)
    sync.sync(["claude"], include_hooks=False)

    text = target.read_text()
    assert "Always use tabs." in text
    assert text.count(BLOCK_START) == 1


# ------------------------------------------------------------ idempotence


def test_resync_is_stable(sync, python_project: Path):
    first = sync.sync(["cursor"], include_hooks=False)
    before = (python_project / ".cursor/skills/tdd/SKILL.md").read_text()
    second = sync.sync(["cursor"], include_hooks=False)
    after = (python_project / ".cursor/skills/tdd/SKILL.md").read_text()

    assert before == after
    assert first["synced"][0]["files_written"] == second["synced"][0]["files_written"]


def test_generated_files_are_marked_as_generated(sync, python_project: Path):
    """A reader who opens one needs to know edits will be overwritten."""
    sync.sync(["cursor"], include_hooks=False)
    assert GENERATED_HEADER in (python_project / ".cursor/skills/tdd/SKILL.md").read_text()


def test_clean_removes_generated_files_only(sync, python_project: Path):
    sync.sync(["cursor"], include_hooks=False)
    mine = python_project / ".cursor/skills/my-own/SKILL.md"
    mine.parent.mkdir(parents=True, exist_ok=True)
    mine.write_text("---\nname: my-own\n---\nMine.\n", encoding="utf-8")

    result = sync.clean(["cursor"])

    assert mine.exists()
    assert not (python_project / ".cursor/skills/tdd/SKILL.md").exists()
    assert result["removed"]


# ------------------------------------------------------------------ hooks


def test_sync_installs_hooks_alongside_resources(sync, python_project: Path):
    result = sync.sync(["cursor"], include_hooks=True)

    assert result["hooks"]["installed"]
    assert (python_project / ".cursor/hooks.json").exists()
    assert (python_project / ".cursor/hooks/guard-secrets.sh").exists()


def test_hooks_can_be_excluded(sync, python_project: Path):
    result = sync.sync(["cursor"], include_hooks=False)
    assert result["hooks"] is None
    assert not (python_project / ".cursor/hooks.json").exists()


def test_unknown_editor_is_rejected_clearly(sync):
    result = sync.sync(["notepad"])
    assert "error" in result
    assert result["synced"] == []


def test_gated_resources_are_not_exported(sync, python_project: Path):
    """A resource withheld from the catalogue must not appear natively either."""
    sync.sync(["cursor"], include_hooks=False)
    assert not (python_project / ".cursor/skills/notebook/SKILL.md").exists()
