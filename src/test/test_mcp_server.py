"""The tool surface, exercised the way a client calls it.

The decorator registers each function with the server and returns it unchanged,
so these call the same callable a connected agent reaches, and a separate test
asserts the registration itself."""

import json
from pathlib import Path
from unittest.mock import AsyncMock

import pytest

from common_rules_server import mcp_server


@pytest.fixture(autouse=True)
def _root(monkeypatch, python_project: Path):
    monkeypatch.setenv("COMMON_RULES_PROJECT_ROOT", str(python_project))
    return python_project


@pytest.fixture
def fake_ctx():
    """A minimal stand-in for the MCP Context.

    Every tool now takes a Context to resolve the project root via MCP roots
    and to read the client's identity out of the handshake. In tests
    COMMON_RULES_PROJECT_ROOT is always set, so the roots call is never
    reached — but the parameter must be present.
    """
    ctx = AsyncMock()
    ctx.session.list_roots = AsyncMock(return_value=AsyncMock(roots=[]))
    ctx.session.client_params.clientInfo.name = "unknown-test-client"
    return ctx


def ctx_with_roots(*paths: str):
    """A Context whose client advertises the given filesystem roots."""
    roots = []
    for path in paths:
        root = AsyncMock()
        root.uri = f"file://{path}"
        roots.append(root)
    ctx = AsyncMock()
    ctx.session.list_roots = AsyncMock(return_value=AsyncMock(roots=roots))
    ctx.session.client_params.clientInfo.name = "unknown-test-client"
    return ctx


async def call(tool, **kwargs):
    return await tool(**kwargs)


# ------------------------------------------------------------------ get_context


@pytest.mark.anyio
async def test_get_context_shape(fake_ctx):
    result = await call(mcp_server.get_context, ctx=fake_ctx)
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
        "project_root",
        "project_root_source",
    }


@pytest.mark.anyio
async def test_get_context_reports_which_directory_it_answered_for(_root: Path, fake_ctx):
    """The caller cannot spot a wrong root unless the answer names it."""
    result = await call(mcp_server.get_context, ctx=fake_ctx)
    assert result["project_root"] == str(_root.resolve())
    assert result["project_root_source"] == "env:COMMON_RULES_PROJECT_ROOT"


@pytest.mark.anyio
async def test_get_context_is_json_serialisable(fake_ctx):
    """Anything returned crosses the MCP boundary as JSON."""
    json.dumps(await call(mcp_server.get_context, ctx=fake_ctx))


@pytest.mark.anyio
async def test_get_context_ships_a_complete_healthy_kit(fake_ctx):
    result = await call(mcp_server.get_context, ctx=fake_ctx)
    assert result["problems"] == []
    assert result["integrity"]["ok"] is True
    assert result["resource_counts"]["rule"] == 7
    assert result["resource_counts"]["agent"] == 6
    assert result["resource_counts"]["workflow"] == 4
    assert result["resource_counts"]["loop"] == 1
    assert result["resource_counts"]["hook"] == 10
    assert result["total_resources"] == sum(result["resource_counts"].values())


# ----------------------------------------------------------------- get_resource


@pytest.mark.anyio
async def test_get_resource_returns_body_and_template(fake_ctx):
    result = await call(mcp_server.get_resource, kind="skill", name="tdd", ctx=fake_ctx)
    assert result["name"] == "tdd"
    assert result["body"]
    assert result["template"].startswith("# TDD Cycle")


@pytest.mark.anyio
async def test_get_resource_unknown_name_is_a_result_not_an_exception(fake_ctx):
    result = await call(mcp_server.get_resource, kind="skill", name="nope", ctx=fake_ctx)
    assert "error" in result
    assert "available" in result


@pytest.mark.anyio
async def test_get_resource_unknown_kind_is_handled(fake_ctx):
    assert "error" in await call(mcp_server.get_resource, kind="gadget", name="x", ctx=fake_ctx)


# --------------------------------------------------------------- create_resource


@pytest.mark.anyio
async def test_create_then_read_round_trip(fake_ctx):
    created = await call(
        mcp_server.create_resource,
        kind="skill",
        name="round-trip",
        description="Round trip check.",
        body="## Instructions\n\nDo it.",
        ctx=fake_ctx,
    )
    assert created["created"] is True

    loaded = await call(mcp_server.get_resource, kind="skill", name="round-trip", ctx=fake_ctx)
    assert loaded["source"] == "project"
    assert "Do it." in loaded["body"]


@pytest.mark.anyio
async def test_create_resource_rejects_traversal(fake_ctx):
    result = await call(
        mcp_server.create_resource,
        kind="skill",
        name="../escape",
        description="Escape.",
        body="B",
        ctx=fake_ctx,
    )
    assert result["created"] is False


# ----------------------------------------------------------------- setup_config


@pytest.mark.anyio
async def test_setup_config_writes_and_reports(_root: Path, fake_ctx):
    result = await call(mcp_server.setup_config, ctx=fake_ctx)

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


@pytest.mark.anyio
async def test_setup_config_installs_the_commit_hook(_root: Path, fake_ctx):
    result = await call(mcp_server.setup_config, ctx=fake_ctx)
    assert result["git_hooks"]["installed"] is True
    assert (_root / ".git" / "hooks" / "commit-msg").exists()


@pytest.mark.anyio
async def test_setup_config_surfaces_what_needs_a_human(_root: Path, fake_ctx):
    result = await call(mcp_server.setup_config, ctx=fake_ctx)
    assert "TEST_COMMAND" in result["env_status"]["needs_input"]
    assert any("TEST_COMMAND" in step for step in result["next_steps"])


@pytest.mark.anyio
async def test_setup_config_does_not_touch_editor_config_by_default(_root: Path, fake_ctx):
    result = await call(mcp_server.setup_config, ctx=fake_ctx)
    assert result["companions"]["applied"] is False


@pytest.mark.anyio
async def test_setup_config_is_idempotent(_root: Path, fake_ctx):
    await call(mcp_server.setup_config, ctx=fake_ctx)
    config_file = _root / ".common-rules-server" / "config.env"
    text = config_file.read_text(encoding="utf-8").replace(
        "TEST_COMMAND=", "TEST_COMMAND=uv run pytest"
    )
    config_file.write_text(text, encoding="utf-8")

    result = await call(mcp_server.setup_config, ctx=fake_ctx)
    assert result["config"]["TEST_COMMAND"] == "uv run pytest"
    assert result["git_hooks"]["action"] == "unchanged"


@pytest.mark.anyio
async def test_setup_config_accepts_an_explicit_editor(_root: Path, fake_ctx):
    result = await call(mcp_server.setup_config, ide="claude", ctx=fake_ctx)
    assert (_root / "CLAUDE.md").exists()
    assert result["ide_rules"]["written"][0]["path"] == "CLAUDE.md"


@pytest.mark.anyio
async def test_setup_config_targets_only_the_active_ide(
    _root: Path, fake_ctx, monkeypatch
):
    """When CLAUDE_CODE_ENTRYPOINT is set, only Claude Code should be targeted."""
    monkeypatch.setenv("CLAUDE_CODE_ENTRYPOINT", "claude-desktop")
    (_root / ".agents").mkdir()

    result = await call(mcp_server.setup_config, ctx=fake_ctx)

    ide_keys = [w["ide"] for w in result["ide_rules"]["written"]]
    assert "claude" in ide_keys
    assert "antigravity" not in ide_keys


@pytest.mark.anyio
async def test_setup_config_falls_back_to_detection_without_entrypoint(
    _root: Path, fake_ctx, monkeypatch
):
    """Without an entrypoint env var, detection finds all present editors."""
    monkeypatch.delenv("CLAUDE_CODE_ENTRYPOINT", raising=False)
    (_root / ".claude").mkdir()
    (_root / ".agents").mkdir()

    result = await call(mcp_server.setup_config, ctx=fake_ctx)

    ide_keys = [w["ide"] for w in result["ide_rules"]["written"]]
    assert "claude" in ide_keys
    assert "antigravity" in ide_keys


# -------------------------------------------------------------- get_bdd_scenario


@pytest.mark.anyio
async def test_get_bdd_scenario_reports_a_missing_feature_file(_root: Path, fake_ctx):
    result = await call(mcp_server.get_bdd_scenario, page=1, ctx=fake_ctx)
    assert "No feature file found" in result["error"]


@pytest.mark.anyio
async def test_get_bdd_scenario_paginates(_root: Path, fake_ctx):
    (_root / "agent_bdd.feature").write_text(
        "Feature: F\n\n  Background:\n    Given setup\n\n"
        "  Scenario: one\n    Then a\n\n  Scenario: two\n    Then b\n",
        encoding="utf-8",
    )
    first = await call(mcp_server.get_bdd_scenario, page=1, ctx=fake_ctx)
    assert first["scenario"]["name"] == "one"
    assert first["has_next"] is True
    assert first["background"]

    last = await call(mcp_server.get_bdd_scenario, page=2, ctx=fake_ctx)
    assert last["has_next"] is False
    assert last["next_page"] is None


def test_project_root_env_var_redirects_the_server(monkeypatch, tmp_path: Path):
    """The server must answer for the project, not for its own directory."""
    monkeypatch.setenv("COMMON_RULES_PROJECT_ROOT", str(tmp_path))
    assert mcp_server._project_root() == str(tmp_path)


@pytest.fixture
def _no_root_env(monkeypatch):
    monkeypatch.delenv("COMMON_RULES_PROJECT_ROOT", raising=False)
    monkeypatch.delenv("CLAUDE_PROJECT_DIR", raising=False)


@pytest.fixture
def sandbox(tmp_path_factory):
    """A directory outside the fixture project, with no project markers above it.

    ``python_project`` puts a git repository in ``tmp_path``, so these tests
    need somewhere that a walk-up genuinely finds nothing.
    """
    return tmp_path_factory.mktemp("sandbox")


@pytest.mark.anyio
async def test_explicit_project_root_beats_everything(fake_ctx, tmp_path: Path):
    """What the caller states is never second-guessed."""
    resolution = await mcp_server._resolve_root(fake_ctx, str(tmp_path))
    assert resolution["root"] == str(tmp_path.resolve())
    assert resolution["source"] == "argument"
    assert resolution["trusted"] is True


@pytest.mark.anyio
async def test_project_root_uses_mcp_roots_when_they_hold_a_project(
    _no_root_env, sandbox: Path
):
    """A root that carries project markers is trusted."""
    (sandbox / ".git").mkdir()
    resolution = await mcp_server._resolve_root(ctx_with_roots(str(sandbox)))
    assert resolution["root"] == str(sandbox.resolve())
    assert resolution["source"] == "mcp-roots"
    assert resolution["trusted"] is True


@pytest.mark.anyio
async def test_project_root_skips_a_root_that_only_contains_projects(
    _no_root_env, sandbox: Path
):
    """Claude Desktop advertises the folder holding the projects, not the project.

    The first root must not win by position alone — the one that actually looks
    like a codebase does.
    """
    container = sandbox / "Projects"
    project = container / "sprintfit"
    project.mkdir(parents=True)
    (project / ".git").mkdir()

    resolution = await mcp_server._resolve_root(
        ctx_with_roots(str(container), str(project))
    )
    assert resolution["root"] == str(project.resolve())
    assert resolution["source"] == "mcp-roots"


@pytest.mark.anyio
async def test_project_root_is_untrusted_when_nothing_looks_like_a_project(
    _no_root_env, sandbox: Path, monkeypatch
):
    """A home directory is not a project, and guessing it must be marked as such."""
    home = sandbox / "home"
    home.mkdir()
    monkeypatch.chdir(home)

    resolution = await mcp_server._resolve_root(ctx_with_roots(str(home)))
    assert resolution["trusted"] is False
    assert resolution["source"] == "mcp-roots-unverified"


@pytest.mark.anyio
async def test_setup_config_refuses_to_write_into_a_guessed_directory(
    _no_root_env, sandbox: Path, monkeypatch, fake_ctx
):
    """The bug this guards: configuration written into the user's home."""
    home = sandbox / "home"
    home.mkdir()
    monkeypatch.chdir(home)
    fake_ctx.session.list_roots = AsyncMock(return_value=AsyncMock(roots=[]))

    result = await call(mcp_server.setup_config, ctx=fake_ctx)

    assert result["error"] == "project_root_unresolved"
    assert not (home / ".common-rules-server").exists()
    assert "project_root" in result["action_required"]


@pytest.mark.anyio
async def test_project_root_walks_up_from_the_working_directory(
    _no_root_env, sandbox: Path, monkeypatch
):
    """A server launched inside a subdirectory still finds the project above it."""
    project = sandbox / "proj"
    nested = project / "src" / "deep"
    nested.mkdir(parents=True)
    (project / "pyproject.toml").write_text("", encoding="utf-8")
    monkeypatch.chdir(nested)

    resolution = await mcp_server._resolve_root(ctx_with_roots())
    assert resolution["root"] == str(project.resolve())
    assert resolution["source"] == "cwd-walk-up"


def test_active_ide_comes_from_the_mcp_handshake(monkeypatch):
    """clientInfo survives a server launched without the editor's environment."""
    monkeypatch.delenv("CLAUDE_CODE_ENTRYPOINT", raising=False)
    ctx = AsyncMock()
    ctx.session.client_params.clientInfo.name = "claude-ai"
    assert mcp_server._active_ide_from_client(ctx) == "claude"


def test_active_ide_from_handshake_is_none_when_unrecognised():
    ctx = AsyncMock()
    ctx.session.client_params.clientInfo.name = "some-other-client"
    assert mcp_server._active_ide_from_client(ctx) is None


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
