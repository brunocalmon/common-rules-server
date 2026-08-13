"""The tool surface, exercised the way a client calls it.

The decorator registers each function with the server and returns it unchanged,
so these call the same callable a connected agent reaches, and a separate test
asserts the registration itself."""

import json
from pathlib import Path

import pytest

from common_rules_server import mcp_server


@pytest.fixture(autouse=True)
def _root(monkeypatch, python_project: Path):
    monkeypatch.setenv("COMMON_RULES_PROJECT_ROOT", str(python_project))
    return python_project


def call(tool, **kwargs):
    return tool(**kwargs)


# ------------------------------------------------------------------ get_context


def test_get_context_shape():
    result = call(mcp_server.get_context)
    assert set(result) == {
        "config",
        "env_status",
        "resources",
        "resource_counts",
        "total_resources",
        "project_overrides",
        "gated_out",
        "problems",
        "integrity",
        "usage",
    }


def test_get_context_is_json_serialisable():
    """Anything returned crosses the MCP boundary as JSON."""
    json.dumps(call(mcp_server.get_context))


def test_get_context_ships_a_complete_healthy_kit():
    result = call(mcp_server.get_context)
    assert result["problems"] == []
    assert result["integrity"]["ok"] is True
    assert result["resource_counts"]["rule"] == 7
    assert result["resource_counts"]["agent"] == 6
    assert result["resource_counts"]["workflow"] == 4
    assert result["resource_counts"]["loop"] == 1
    assert result["resource_counts"]["hook"] == 10
    assert result["total_resources"] == sum(result["resource_counts"].values())


# ----------------------------------------------------------------- get_resource


def test_get_resource_returns_body_and_template():
    result = call(mcp_server.get_resource, kind="skill", name="tdd")
    assert result["name"] == "tdd"
    assert result["body"]
    assert result["template"].startswith("# TDD Cycle")


def test_get_resource_unknown_name_is_a_result_not_an_exception():
    result = call(mcp_server.get_resource, kind="skill", name="nope")
    assert "error" in result
    assert "available" in result


def test_get_resource_unknown_kind_is_handled():
    assert "error" in call(mcp_server.get_resource, kind="gadget", name="x")


# --------------------------------------------------------------- create_resource


def test_create_then_read_round_trip():
    created = call(
        mcp_server.create_resource,
        kind="skill",
        name="round-trip",
        description="Round trip check.",
        body="## Instructions\n\nDo it.",
    )
    assert created["created"] is True

    loaded = call(mcp_server.get_resource, kind="skill", name="round-trip")
    assert loaded["source"] == "project"
    assert "Do it." in loaded["body"]


def test_create_resource_rejects_traversal():
    result = call(
        mcp_server.create_resource,
        kind="skill",
        name="../escape",
        description="Escape.",
        body="B",
    )
    assert result["created"] is False


# ----------------------------------------------------------------- setup_config


def test_setup_config_writes_and_reports(_root: Path):
    result = call(mcp_server.setup_config)

    assert (_root / ".common-rules-server" / "config.env").exists()
    assert set(result) >= {
        "config",
        "env_status",
        "git_hooks",
        "ide_rules",
        "companions",
        "next_steps",
        "message",
    }
    json.dumps(result)


def test_setup_config_installs_the_commit_hook(_root: Path):
    result = call(mcp_server.setup_config)
    assert result["git_hooks"]["installed"] is True
    assert (_root / ".git" / "hooks" / "commit-msg").exists()


def test_setup_config_surfaces_what_needs_a_human(_root: Path):
    result = call(mcp_server.setup_config)
    assert "TEST_COMMAND" in result["env_status"]["needs_input"]
    assert any("TEST_COMMAND" in step for step in result["next_steps"])


def test_setup_config_does_not_touch_editor_config_by_default(_root: Path):
    result = call(mcp_server.setup_config)
    assert result["companions"]["applied"] is False


def test_setup_config_is_idempotent(_root: Path):
    call(mcp_server.setup_config)
    config_file = _root / ".common-rules-server" / "config.env"
    text = config_file.read_text(encoding="utf-8").replace(
        "TEST_COMMAND=", "TEST_COMMAND=uv run pytest"
    )
    config_file.write_text(text, encoding="utf-8")

    result = call(mcp_server.setup_config)
    assert result["config"]["TEST_COMMAND"] == "uv run pytest"
    assert result["git_hooks"]["action"] == "unchanged"


def test_setup_config_accepts_an_explicit_editor(_root: Path):
    result = call(mcp_server.setup_config, ide="claude")
    assert (_root / "CLAUDE.md").exists()
    assert result["ide_rules"]["written"][0]["path"] == "CLAUDE.md"


# -------------------------------------------------------------- get_bdd_scenario


def test_get_bdd_scenario_reports_a_missing_feature_file(_root: Path):
    result = call(mcp_server.get_bdd_scenario, page=1)
    assert "No feature file found" in result["error"]


def test_get_bdd_scenario_paginates(_root: Path):
    (_root / "agent_bdd.feature").write_text(
        "Feature: F\n\n  Background:\n    Given setup\n\n"
        "  Scenario: one\n    Then a\n\n  Scenario: two\n    Then b\n",
        encoding="utf-8",
    )
    first = call(mcp_server.get_bdd_scenario, page=1)
    assert first["scenario"]["name"] == "one"
    assert first["has_next"] is True
    assert first["background"]

    last = call(mcp_server.get_bdd_scenario, page=2)
    assert last["has_next"] is False
    assert last["next_page"] is None


def test_project_root_env_var_redirects_the_server(monkeypatch, tmp_path: Path):
    """The server must answer for the project, not for its own directory."""
    monkeypatch.setenv("COMMON_RULES_PROJECT_ROOT", str(tmp_path))
    assert mcp_server._project_root() == str(tmp_path)
    assert call(mcp_server.get_context)["env_status"]["config_dir"].startswith(str(tmp_path))


@pytest.mark.anyio
async def test_every_tool_is_registered_with_the_server():
    """Calling the function proves the body works; this proves clients can reach it."""
    registered = {tool.name for tool in await mcp_server.mcp.list_tools()}
    assert registered == {
        "get_context",
        "get_resource",
        "create_resource",
        "setup_config",
        "get_bdd_scenario",
        "sync_to_ide",
    }


@pytest.fixture
def anyio_backend():
    return "asyncio"
