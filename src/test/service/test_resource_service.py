"""Resource loading, resolution, overriding and creation."""

from pathlib import Path

from common_rules_server.service.resource_service import ResourceService
from test.conftest import write_resource

SKILL = """---
kind: skill
name: sample
description: A sample skill.
trigger: user-invoked
relationships:
  output: templates/sample.md
env:
  optional: [WIKI_DIR]
---

Documentation lives in {{WIKI_DIR}} and status is {{STATUS}}.
"""


def _project_skills(service: ResourceService) -> Path:
    config = service.config_service.get_config()["config"]
    return service.project_root / config["RESOURCES_DIR"] / "skills"


# ------------------------------------------------------------------- loading


def test_loads_the_full_built_in_kit(resources: ResourceService):
    context = resources.get_context()
    assert context["problems"] == []
    assert context["total_resources"] > 0
    assert context["resource_counts"]["rule"] >= 2


def test_get_context_omits_instruction_bodies(resources: ResourceService):
    """Progressive disclosure is the point of this call."""
    for entry in resources.get_context()["resources"]:
        assert "body" not in entry
        assert "template" not in entry


def test_get_context_carries_config_and_env_status(resources: ResourceService):
    context = resources.get_context()
    assert "WIKI_DIR" in context["config"]
    assert "needs_input" in context["env_status"]


def test_unparseable_file_is_reported_not_swallowed(isolated_resources: ResourceService):
    write_resource(isolated_resources.built_in_dir, "broken", "no frontmatter here\n")
    context = isolated_resources.get_context()
    assert len(context["problems"]) == 1
    assert "missing YAML frontmatter" in context["problems"][0]["error"]
    assert context["integrity"]["ok"] is False


# -------------------------------------------------------------- placeholders


def test_placeholders_are_resolved_in_bodies(isolated_resources: ResourceService):
    write_resource(isolated_resources.built_in_dir, "sample", SKILL)
    result = isolated_resources.get_resource("skill", "sample")
    assert "Documentation lives in .docs" in result["body"]
    assert result["resolved_env"]["WIKI_DIR"] == ".docs"


def test_report_slots_survive_resolution(isolated_resources: ResourceService):
    write_resource(isolated_resources.built_in_dir, "sample", SKILL)
    result = isolated_resources.get_resource("skill", "sample")
    assert "{{STATUS}}" in result["body"]
    assert "STATUS" in result["unresolved_env"]


def test_no_builtin_resource_leaks_an_unresolved_config_key(resources: ResourceService):
    """Every {{KEY}} in a shipped resource must be a key the config layer knows.

    A resource referencing a key that does not exist in the schema can never
    resolve, and would reach the agent as literal braces forever.
    """
    from common_rules_server.service.config_service import SCHEMA_BY_NAME
    from common_rules_server.util import placeholders

    catalogue = resources.load()
    for record in catalogue["resources"].values():
        for key in placeholders.find_placeholders(record["raw_body"]):
            assert key in SCHEMA_BY_NAME, (
                f"{record['kind']}:{record['name']} references {{{{{key}}}}}, "
                "which is not a configuration key"
            )


# ------------------------------------------------------------------ gating


def test_gated_resources_are_withheld_until_enabled(resources: ResourceService):
    context = resources.get_context()
    gated = {entry["name"] for entry in context["gated_out"]}
    assert "notebook" in gated
    assert all(entry["name"] != "notebook" for entry in context["resources"])


def test_enabling_a_flag_admits_its_resource(resources: ResourceService):
    service = resources.config_service
    service.write_config()
    text = service.env_file.read_text(encoding="utf-8").replace(
        "ENABLE_NOTEBOOKS=false", "ENABLE_NOTEBOOKS=true"
    )
    service.env_file.write_text(text, encoding="utf-8")

    context = resources.get_context()
    assert any(entry["name"] == "notebook" for entry in context["resources"])
    assert all(entry["name"] != "notebook" for entry in context["gated_out"])


# ---------------------------------------------------------------- retrieval


def test_get_resource_attaches_the_output_template(resources: ResourceService):
    result = resources.get_resource("skill", "tdd")
    assert result["template_ref"] == "templates/tdd.md"
    assert result["template"].startswith("# TDD Cycle")


def test_a_gated_resource_reports_its_gate_not_absence(resources: ResourceService):
    """Reporting it as missing sends the agent to create what already exists."""
    result = resources.get_resource("skill", "notebook")

    assert "switched off" in result["error"]
    assert result["gate"] == "ENABLE_NOTEBOOKS"
    assert "ENABLE_NOTEBOOKS=true" in result["hint"]
    assert "Ask the user" in result["hint"]


def test_unknown_name_lists_what_is_gated_off_too(resources: ResourceService):
    result = resources.get_resource("skill", "nope")
    assert "notebook" in result["gated_off"]
    assert "notebook" not in result["available"]


def test_creating_a_hook_without_an_event_explains_the_contract(resources: ResourceService):
    result = resources.create_resource("hook", "h", "Guards something.", "body")

    assert result["created"] is False
    assert "before-shell" in result["valid_events"]
    assert "HOOK_COMMAND" in result["authoring_contract"]


def test_a_complete_hook_can_be_created(resources: ResourceService):
    result = resources.create_resource(
        "hook",
        "custom-guard",
        "Blocks a project-specific command.",
        "## Script\n\n```sh\ncase \"$HOOK_COMMAND\" in *danger*) decision=deny ;; esac\n```",
        extra_fields={"event": "before-shell"},
    )
    assert result["created"] is True

    loaded = resources.get_resource("hook", "custom-guard")
    assert loaded["event"] == "before-shell"
    assert "decision=deny" in loaded["script"]


def test_unknown_resource_returns_guidance_not_an_exception(resources: ResourceService):
    result = resources.get_resource("skill", "does-not-exist")
    assert result["error"] == "No skill named 'does-not-exist'."
    assert "tdd" in result["available"]
    assert result["hint"] == "Call get_context() to list every resource."


# ----------------------------------------------------------------- creation


def test_created_resource_lands_under_its_kind_directory(resources: ResourceService):
    """Kind directories are what stop a rule and a skill sharing a filename."""
    resources.create_resource("skill", "demo", "A demo.", "Body.")
    resources.create_resource("rule", "demo", "A demo rule.", "Body.")

    config = resources.config_service.get_config()["config"]
    root = resources.project_root / config["RESOURCES_DIR"]
    assert (root / "skills" / "demo.md").exists()
    assert (root / "rules" / "demo.md").exists()

    context = resources.get_context()
    names = {(e["kind"], e["name"]) for e in context["resources"]}
    assert ("skill", "demo") in names
    assert ("rule", "demo") in names


def test_created_resource_is_immediately_discoverable(resources: ResourceService):
    resources.create_resource("skill", "demo", "A demo.", "Body.")
    context = resources.get_context()
    entry = next(e for e in context["resources"] if e["name"] == "demo")
    assert entry["source"] == "project"
    assert "demo" in context["project_overrides"]


def test_created_resource_is_valid_on_reload(resources: ResourceService):
    """A resource written by the tool must satisfy the parser that reads it."""
    result = resources.create_resource("skill", "demo", "A demo.", "Body.")
    assert result["validation"]["valid"] is True
    assert resources.get_resource("skill", "demo").get("error") is None


def test_project_resource_overrides_the_built_in(resources: ResourceService):
    result = resources.create_resource(
        "skill", "verify", "Project verification.", "Run the project pipeline."
    )
    assert any("overrides the built-in" in w for w in result["validation"]["warnings"])

    loaded = resources.get_resource("skill", "verify")
    assert loaded["source"] == "project"
    assert "Run the project pipeline." in loaded["body"]

    built_in = resources.built_in_dir / "skills" / "verify.md"
    assert "Run the project pipeline." not in built_in.read_text(encoding="utf-8")


def test_invalid_kind_is_rejected_without_writing(resources: ResourceService):
    result = resources.create_resource("gadget", "thing", "A thing.", "Body.")
    assert result["created"] is False
    assert "Invalid kind 'gadget'" in result["error"]
    assert not _project_skills(resources).exists()


def test_path_traversal_in_the_name_is_rejected(resources: ResourceService):
    """A crafted name must not escape the resources directory."""
    result = resources.create_resource("skill", "../evil", "Escape.", "Body.")
    assert result["created"] is False
    assert "Invalid name" in result["error"]
    assert not (resources.project_root / "evil.md").exists()
    assert not (resources.project_root / ".common-rules-server" / "evil.md").exists()


def test_absolute_path_in_the_name_is_rejected(resources: ResourceService):
    result = resources.create_resource("skill", "/etc/passwd", "Escape.", "Body.")
    assert result["created"] is False
    assert "Invalid name" in result["error"]


def test_empty_description_is_rejected(resources: ResourceService):
    result = resources.create_resource("skill", "undescribed", "   ", "Body.")
    assert result["created"] is False
    assert result["error"] == "A description is required."


def test_extra_fields_are_carried_into_frontmatter(resources: ResourceService):
    resources.create_resource(
        "skill",
        "demo",
        "A demo.",
        "Body.",
        extra_fields={"trigger": "model-invoked", "relationships": {"output": "templates/demo.md"}},
    )
    loaded = resources.get_resource("skill", "demo")
    assert loaded["trigger"] == "model-invoked"
    assert loaded["relationships"]["output"] == "templates/demo.md"


# ---------------------------------------------------------------- integrity


def test_dangling_reference_is_detected(isolated_resources: ResourceService):
    write_resource(
        isolated_resources.built_in_dir,
        "orphan",
        "---\nkind: skill\nname: orphan\ndescription: X.\ntrigger: user-invoked\n"
        "relationships:\n  goes-to:\n    - target: /nowhere\n---\nBody\n",
    )
    integrity = isolated_resources.check_integrity()
    assert integrity["ok"] is False
    assert integrity["dangling_references"][0]["target"] == "/nowhere"


def test_missing_output_template_is_detected(isolated_resources: ResourceService):
    write_resource(
        isolated_resources.built_in_dir,
        "sample",
        "---\nkind: skill\nname: sample\ndescription: X.\ntrigger: user-invoked\n"
        "relationships:\n  output: templates/nope.md\n---\nBody\n",
    )
    integrity = isolated_resources.check_integrity()
    assert integrity["ok"] is False
    assert integrity["missing_templates"][0]["template"] == "templates/nope.md"


def test_cache_is_invalidated_when_a_file_changes(isolated_resources: ResourceService):
    path = write_resource(isolated_resources.built_in_dir, "sample", SKILL)
    assert isolated_resources.get_context()["total_resources"] == 1

    path.write_text(
        SKILL.replace("name: sample", "name: renamed").replace(
            "output: templates/sample.md", "output: templates/renamed.md"
        ),
        encoding="utf-8",
    )
    # mtime granularity: force a distinct stamp rather than sleeping.
    import os

    stat = path.stat()
    os.utime(path, ns=(stat.st_atime_ns + 10**9, stat.st_mtime_ns + 10**9))

    names = {e["name"] for e in isolated_resources.get_context()["resources"]}
    assert names == {"renamed"}
