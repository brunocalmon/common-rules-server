"""The feature file states exact numbers; this keeps them true.

The scenarios deliberately assert literal values rather than invariants, because
an agent executing them has to compare against something concrete. The cost is
that they go stale the moment a resource is added — and a stale scenario makes
the agent report a failure that is not real, which trains it to discount the
suite.

So the literals stay exact, and this test fails the moment they drift.
"""

import json
import re
from pathlib import Path

import pytest

FEATURE = Path(__file__).resolve().parents[2] / "agent_bdd.feature"


@pytest.fixture
def text() -> str:
    return FEATURE.read_text(encoding="utf-8")


@pytest.fixture
def live(resources):
    return resources.get_context()


def test_feature_file_exists(text: str):
    assert "Feature: Common Rules orchestration server" in text


def test_stated_total_matches_the_catalogue(text: str, live):
    stated = int(re.search(r'"total_resources" equals (\d+)', text).group(1))
    assert stated == live["total_resources"], (
        f"agent_bdd.feature says {stated} resources; the kit has "
        f"{live['total_resources']}. Update the scenario."
    )


def test_stated_counts_match_the_catalogue(text: str, live):
    stated = json.loads(re.search(r'"resource_counts" equals (\{[^}]*\})', text).group(1))
    assert stated == live["resource_counts"], (
        f"agent_bdd.feature says {stated}; the kit has {live['resource_counts']}."
    )


def test_stated_gated_count_matches(text: str, live):
    stated = int(re.search(r'"gated_out" contains exactly (\d+) entries', text).group(1))
    assert stated == len(live["gated_out"])


def test_enabling_one_gate_arithmetic_is_consistent(text: str, live):
    """The scenario that enables ENABLE_NOTEBOOKS asserts total + 1."""
    totals = [int(n) for n in re.findall(r'"total_resources" equals (\d+)', text)]
    assert len(totals) >= 2
    assert totals[1] == totals[0] + 1, (
        "the enabled-gate scenario must assert exactly one more resource"
    )


def test_every_tool_named_in_the_feature_exists(text: str):
    import asyncio

    from common_rules_server import mcp_server

    registered = {t.name for t in asyncio.run(mcp_server.mcp.list_tools())}
    mentioned = set(re.findall(r"I call (\w+)\(", text))
    unknown = mentioned - registered
    assert not unknown, f"feature file calls tools that do not exist: {unknown}"


def test_every_registered_tool_has_at_least_one_scenario(text: str):
    import asyncio

    from common_rules_server import mcp_server

    registered = {t.name for t in asyncio.run(mcp_server.mcp.list_tools())}
    mentioned = set(re.findall(r"I call (\w+)\(", text))
    uncovered = registered - mentioned
    assert not uncovered, f"tools with no acceptance scenario: {uncovered}"


@pytest.fixture
def anyio_backend():
    return "asyncio"
