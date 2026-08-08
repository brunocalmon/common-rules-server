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
    assert (python_project / ".agents/AGENTS.md").exists()


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


def test_resources_naming_server_tools_carry_a_fallback(sync, python_project: Path):
    """Same dead end as naming a template the export does not carry.

    An exported skill telling the agent to call a tool that is not running
    leaves it with no route forward.
    """
    sync.sync(["cursor"], include_hooks=False)
    text = (python_project / ".cursor/skills/bdd-run/SKILL.md").read_text()

    assert "## Without the server" in text
    assert "get_bdd_scenario" in text
    assert "Read the feature file directly" in text


def test_resources_needing_no_fallback_do_not_get_one(sync, python_project: Path):
    sync.sync(["cursor"], include_hooks=False)
    assert "Without the server" not in (
        python_project / ".cursor/skills/tdd/SKILL.md"
    ).read_text()


def test_every_server_tool_reference_has_a_documented_fallback(sync, resources, python_project: Path):
    """A tool added later must not silently dead-end the export."""
    import asyncio

    from common_rules_server import mcp_server
    from common_rules_server.service.sync_service import TOOL_FALLBACKS

    registered = {t.name for t in asyncio.run(mcp_server.mcp.list_tools())}
    referenced = {
        tool
        for record in resources.load()["resources"].values()
        for tool in registered
        if tool in (record.get("body") or "")
    }
    assert referenced <= set(TOOL_FALLBACKS), (
        f"resources reference these tools with no sync fallback: "
        f"{referenced - set(TOOL_FALLBACKS)}"
    )


@pytest.fixture
def anyio_backend():
    return "asyncio"


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


def test_setup_guidance_and_synced_rules_coexist(sync, resources, python_project: Path):
    """Both write CLAUDE.md. A shared marker made the second erase the first."""
    from common_rules_server.service.ide_service import IdeService
    from common_rules_server.util import managed_blocks

    ide = IdeService(str(python_project))
    ide.setup_ide_rules(["claude"])
    sync.sync(["claude"], include_hooks=False)
    ide.setup_ide_rules(["claude"])  # and again, in the other order

    text = (python_project / "CLAUDE.md").read_text()
    assert "get_context()" in text, "setup guidance was lost"
    assert "## orchestrator" in text, "synced rules were lost"
    assert set(managed_blocks.block_names(text)) == {"guidance", "resources"}


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


# --------------------------------------------------------- native commands
#
# The gap that motivated EPC-008: a skill reachable only through the server is
# a skill the user cannot type. These check the command list the editor reads.


def test_claude_export_lists_user_invocable_resources_as_commands(sync, python_project: Path):
    sync.sync(["claude"], include_hooks=False)
    text = (python_project / "CLAUDE.md").read_text(encoding="utf-8")

    assert "## Custom Commands" in text
    assert "<chat-commands>" in text and "</chat-commands>" in text
    assert "- /grill-me:" in text


def test_editors_without_the_capability_get_no_command_block(sync, python_project: Path):
    """Declared on SyncTarget, so this holds for any target that opts out."""
    sync.sync(["antigravity"], include_hooks=False)
    assert "<chat-commands>" not in (python_project / ".agents/AGENTS.md").read_text(encoding="utf-8")


def test_workflows_reach_the_command_list_despite_having_no_trigger(sync, python_project: Path):
    """`trigger` is required of skills only.

    Filtering the command list on it alone silently drops every workflow — the
    four resources a user is most likely to type by name.
    """
    sync.sync(["claude"], include_hooks=False)
    block = (python_project / "CLAUDE.md").read_text(encoding="utf-8")

    for workflow in ("feature-dev", "bug-fix", "docs-gen", "bdd-cycle"):
        assert f"- /{workflow}:" in block, f"{workflow} is not typeable"
    assert "- /pr-babysit:" in block, "the loop is not typeable"


def test_a_command_can_still_be_model_invoked(sync, python_project: Path):
    """The regression that `trigger: both` exists to prevent.

    Marking grill-me `user-invoked` to get it listed would emit
    disable-model-invocation, severing the orchestrator rule's "Offer
    /grill-me", feature-dev's Discover phase and qa-engineer's required edge.
    """
    sync.sync(["claude"], include_hooks=False)

    assert "- /grill-me:" in (python_project / "CLAUDE.md").read_text(encoding="utf-8")
    skill = (python_project / ".claude/skills/grill-me/SKILL.md").read_text(encoding="utf-8")
    assert "disable-model-invocation" not in skill


def test_a_strictly_user_invoked_skill_still_opts_out_of_model_invocation(
    sync, python_project: Path
):
    skill = (python_project / ".claude/skills/to-spec/SKILL.md")
    sync.sync(["claude"], include_hooks=False)
    assert "disable-model-invocation: true" in skill.read_text(encoding="utf-8")


def test_hooks_never_appear_as_commands(sync, python_project: Path):
    """A hook is fired by an event; it can never be typed."""
    sync.sync(["claude"], include_hooks=False)
    text = (python_project / "CLAUDE.md").read_text(encoding="utf-8")
    for hook in ("guard-secrets", "guard-destructive", "protect-authorship"):
        assert f"- /{hook}:" not in text


def test_the_command_block_is_byte_identical_on_re_sync(sync, python_project: Path):
    sync.sync(["claude"], include_hooks=False)
    first = (python_project / "CLAUDE.md").read_text(encoding="utf-8")
    sync.sync(["claude"], include_hooks=False)
    assert (python_project / "CLAUDE.md").read_text(encoding="utf-8") == first


# ------------------------------------------------- built-in + user resources
#
# The kit ships working with no configuration, and a project's own resources
# compose on top. Both halves have to survive the export, not just resolution.


def test_a_project_only_skill_becomes_a_native_command(sync, resources, python_project: Path):
    resources.create_resource(
        "skill", "house-style", "Applies this team's review conventions.", "Body.",
        extra_fields={"trigger": "user-invoked"},
    )
    sync.sync(["claude"], include_hooks=False)

    assert "- /house-style:" in (python_project / "CLAUDE.md").read_text(encoding="utf-8")
    assert (python_project / ".claude/skills/house-style/SKILL.md").exists()


def test_a_project_override_exports_the_project_body(sync, resources, python_project: Path):
    """Resolving to the override but exporting the built-in is a silent failure."""
    resources.create_resource("skill", "verify", "Project verification.", "Run the house pipeline.")
    sync.sync(["claude"], include_hooks=False)

    skill = (python_project / ".claude/skills/verify/SKILL.md").read_text(encoding="utf-8")
    assert "Run the house pipeline." in skill


def test_gated_resources_stay_out_of_the_export(sync, python_project: Path):
    sync.sync(["claude"], include_hooks=False)
    assert not (python_project / ".claude/skills/notebook").exists()
    assert "- /notebook:" not in (python_project / "CLAUDE.md").read_text(encoding="utf-8")


# --------------------------------------------------------- tool restriction
#
# A `constraints` line saying the orchestrator must not edit files is prose.
# The `tools:` frontmatter is the part the editor enforces, so it has to
# survive the export or the constraint is advisory.


def test_the_orchestrator_exports_without_the_tools_it_must_not_have(sync, python_project: Path):
    """It delegates implementation; giving it Edit or Bash invites it to implement."""
    sync.sync(["claude"], include_hooks=False)
    front = (python_project / ".claude/agents/orchestrator.md").read_text(encoding="utf-8")
    line = next(l for l in front.splitlines() if l.startswith("tools:"))

    assert "Edit" not in line
    assert "Write" not in line
    assert "Bash" not in line
    assert "Agent" in line, "it cannot spawn workers without a spawn tool"


def test_the_developer_exports_with_the_tools_it_needs(sync, python_project: Path):
    sync.sync(["claude"], include_hooks=False)
    front = (python_project / ".claude/agents/developer.md").read_text(encoding="utf-8")
    line = next(l for l in front.splitlines() if l.startswith("tools:"))

    assert "Edit" in line and "Bash" in line
    assert "Agent" not in line, "a worker that can spawn is an unbounded tree"


def test_every_agent_carries_a_tools_line_after_export(sync, python_project: Path):
    """An agent with no tools line inherits every tool the editor has."""
    sync.sync(["claude"], include_hooks=False)
    for path in (python_project / ".claude/agents").glob("*.md"):
        text = path.read_text(encoding="utf-8")
        assert any(l.startswith("tools:") for l in text.splitlines()), (
            f"{path.name} exports unrestricted"
        )


def test_unmapped_tool_names_are_dropped_not_guessed(sync):
    from common_rules_server.service.sync_service import _native_tools

    assert _native_tools(["read", "code-review-graph", "edit"]) == ["Read", "Edit"]
    assert _native_tools(["execute", "git-diff"]) == ["Bash"]  # collapsed
    assert _native_tools(["Read", "Bash"]) == ["Read", "Bash"]  # already native


def test_agents_are_typeable_and_marked_as_subagents(sync, python_project: Path):
    """An agent nobody can name is an agent that never runs.

    The editor knows it as a subagent type, but without a command the user has
    no way to ask for one.
    """
    sync.sync(["claude"], include_hooks=False)
    text = (python_project / "CLAUDE.md").read_text(encoding="utf-8")

    for agent in ("orchestrator", "developer", "reviewer", "architect", "researcher"):
        assert f"- /{agent} (subagent):" in text, f"{agent} cannot be invoked"


def test_only_agents_carry_the_subagent_marker(sync, python_project: Path):
    """A skill runs here; an agent runs in its own window. Marking them the
    same way loses the distinction that makes delegation work."""
    sync.sync(["claude"], include_hooks=False)
    block = (python_project / "CLAUDE.md").read_text(encoding="utf-8")
    listed = [l for l in block.splitlines() if l.startswith("- /")]

    assert [l for l in listed if "(subagent)" in l], "no agents listed"
    for line in listed:
        if "(subagent)" not in line:
            assert not line.startswith("- /orchestrator"), "agent listed unmarked"
    assert "- /grill-me (subagent):" not in block, "a skill was marked as an agent"


# --------------------------------------------------- configuring what is used
#
# Syncing every layout because none was named leaves .cursor/ and .agents/ in a
# project that only ever runs Claude Code — directories the user did not ask
# for and has to recognise as ours before deleting.


def test_with_no_argument_it_writes_only_for_detected_editors(sync, python_project: Path):
    (python_project / ".claude").mkdir(exist_ok=True)

    result = sync.sync(include_hooks=False)

    assert [entry["ide"] for entry in result["synced"]] == ["claude"]
    assert (python_project / "CLAUDE.md").exists()
    assert not (python_project / ".cursor").exists()
    assert not (python_project / ".agents").exists()


def test_two_detected_editors_both_get_configured(sync, python_project: Path):
    (python_project / ".claude").mkdir(exist_ok=True)
    (python_project / ".cursor").mkdir(exist_ok=True)

    result = sync.sync(include_hooks=False)

    assert {entry["ide"] for entry in result["synced"]} == {"claude", "cursor"}
    assert not (python_project / ".agents").exists()


def test_detecting_nothing_writes_nothing_and_says_so(sync, python_project: Path):
    """Scattering layouts on a guess is worse than asking one question."""
    result = sync.sync(include_hooks=False)

    assert result["synced"] == []
    assert result["detected"] == []
    assert "No editor detected" in result["error"]
    assert "sync_to_ide(ides=" in result["hint"]
    for layout in (".cursor", ".claude", ".agents"):
        assert not (python_project / layout).exists()


def test_an_explicit_choice_still_overrides_detection(sync, python_project: Path):
    """Naming an editor is a decision; detection must not veto it."""
    (python_project / ".claude").mkdir(exist_ok=True)

    result = sync.sync(["cursor"], include_hooks=False)

    assert [entry["ide"] for entry in result["synced"]] == ["cursor"]
    assert (python_project / ".cursor/skills/tdd/SKILL.md").exists()


def test_clean_removes_the_managed_block_from_the_always_file(sync, python_project: Path):
    """Leaving it behind advertises commands whose files were just deleted."""
    sync.sync(["claude"], include_hooks=False)
    assert "<chat-commands>" in (python_project / "CLAUDE.md").read_text(encoding="utf-8")

    result = sync.clean(["claude"])

    assert "CLAUDE.md" in result["removed"]
    assert not (python_project / "CLAUDE.md").exists()


def test_clean_keeps_what_the_user_wrote_around_the_block(sync, python_project: Path):
    claude_md = python_project / "CLAUDE.md"
    claude_md.write_text("# My own notes\n\nKeep this.\n", encoding="utf-8")
    sync.sync(["claude"], include_hooks=False)

    sync.clean(["claude"])

    text = claude_md.read_text(encoding="utf-8")
    assert "Keep this." in text
    assert "<chat-commands>" not in text
    assert "BEGIN common-rules" not in text


def test_clean_leaves_an_unrelated_always_file_alone(sync, python_project: Path):
    """A CLAUDE.md we never wrote to must not be deleted."""
    claude_md = python_project / "CLAUDE.md"
    claude_md.write_text("# Hand-written only\n", encoding="utf-8")

    result = sync.clean(["claude"])

    assert claude_md.exists()
    assert "CLAUDE.md" not in result["removed"]


# ------------------------------------------------------ agents you can type
#
# Claude Code keeps subagents and slash commands in separate namespaces. A file
# in .claude/agents defines a type the model may spawn; it gives the user no way
# to ask for it by name. Listing /orchestrator as a command without this is a
# promise the editor does not keep.


def test_each_agent_gets_a_typed_command(sync, python_project: Path):
    sync.sync(["claude"], include_hooks=False)

    for agent in ("orchestrator", "developer", "reviewer", "researcher", "architect"):
        path = python_project / ".claude/commands" / f"{agent}.md"
        assert path.exists(), f"/{agent} is advertised but has no command file"


def test_the_command_spawns_the_agent_of_the_same_name(sync, python_project: Path):
    sync.sync(["claude"], include_hooks=False)
    text = (python_project / ".claude/commands/orchestrator.md").read_text(encoding="utf-8")

    assert 'subagent_type: "orchestrator"' in text
    assert "$ARGUMENTS" in text
    assert "description:" in text


def test_every_advertised_agent_command_exists(sync, python_project: Path):
    """The chat-commands block and the commands directory must not disagree."""
    result = sync.sync(["claude"], include_hooks=False)
    advertised = set(result["synced"][0]["commands"])
    agents = {r["name"] for r in sync.resources.load()["resources"].values() if r["kind"] == "agent"}

    for name in advertised & agents:
        assert (python_project / ".claude/commands" / f"{name}.md").exists(), (
            f"/{name} is listed in chat-commands with no command file behind it"
        )


def test_editors_without_a_commands_dir_get_none(sync, python_project: Path):
    sync.sync(["cursor"], include_hooks=False)
    assert not (python_project / ".cursor/commands").exists()


def test_clean_removes_the_generated_commands(sync, python_project: Path):
    sync.sync(["claude"], include_hooks=False)
    assert (python_project / ".claude/commands/orchestrator.md").exists()

    sync.clean(["claude"])

    assert not (python_project / ".claude/commands/orchestrator.md").exists()
