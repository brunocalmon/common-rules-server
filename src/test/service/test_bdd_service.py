"""Gherkin pagination.

Each page must stand alone: an agent reading scenario 7 has not read scenarios
1 through 6, so the feature context and Background have to travel with it.
"""

from pathlib import Path

import pytest

from common_rules_server.service.bdd_service import BddService

FEATURE = """Feature: Example system

  Some description of the system
  spanning two lines.

  Background:
    Given the system is running
    And the database is seeded

  @smoke @api
  Scenario: first behaviour
    When I call the endpoint
    Then I receive 200

  Scenario Outline: parameterised behaviour
    When I call with <input>
    Then I receive <output>

    Examples:
      | input | output |
      | a     | 1      |
      | b     | 2      |

  @slow
  Scenario: last behaviour
    When I wait
    Then something happens
"""


@pytest.fixture
def feature_project(tmp_path: Path) -> Path:
    (tmp_path / "agent_bdd.feature").write_text(FEATURE, encoding="utf-8")
    return tmp_path


def test_counts_scenarios_including_outlines(feature_project: Path):
    """A Scenario Outline is a scenario; `Examples:` is its data, not a new one."""
    summary = BddService(str(feature_project)).summary()
    assert summary["total_scenarios"] == 3
    assert summary["feature"] == "Example system"
    assert summary["has_background"] is True


def test_first_page_returns_the_first_scenario(feature_project: Path):
    page = BddService(str(feature_project)).get_scenario(1)
    assert page["scenario"]["name"] == "first behaviour"
    assert page["scenario"]["keyword"] == "Scenario"
    assert page["page"] == 1
    assert page["has_next"] is True
    assert page["next_page"] == 2


def test_every_page_carries_the_background(feature_project: Path):
    """Without it, a scenario read in isolation cannot be executed."""
    service = BddService(str(feature_project))
    for page_number in (1, 2, 3):
        page = service.get_scenario(page_number)
        assert "the database is seeded" in page["background"]
        assert page["feature"] == "Example system"
        assert "spanning two lines" in page["feature_description"]


def test_tags_are_attached_to_their_scenario(feature_project: Path):
    service = BddService(str(feature_project))
    assert service.get_scenario(1)["scenario"]["tags"] == ["@smoke", "@api"]
    assert service.get_scenario(2)["scenario"]["tags"] == []
    assert service.get_scenario(3)["scenario"]["tags"] == ["@slow"]


def test_a_tag_line_is_not_absorbed_by_the_previous_scenario(feature_project: Path):
    assert "@slow" not in BddService(str(feature_project)).get_scenario(2)["scenario"]["body"]


def test_outline_keeps_its_examples_table(feature_project: Path):
    page = BddService(str(feature_project)).get_scenario(2)
    assert page["scenario"]["keyword"] == "Scenario Outline"
    assert "| a     | 1      |" in page["scenario"]["body"]


def test_last_page_says_it_is_last(feature_project: Path):
    page = BddService(str(feature_project)).get_scenario(3)
    assert page["has_next"] is False
    assert page["next_page"] is None
    assert "last scenario" in page["instruction"]


def test_instruction_points_at_the_next_page(feature_project: Path):
    page = BddService(str(feature_project)).get_scenario(1)
    assert "get_bdd_scenario(page=2)" in page["instruction"]
    assert "Report the observed value" in page["instruction"]


def test_page_beyond_the_end_reports_the_valid_range(feature_project: Path):
    page = BddService(str(feature_project)).get_scenario(9999)
    assert "Page 9999 is out of range" in page["error"]
    assert "valid pages 1-3" in page["error"]
    assert "scenario" not in page


def test_page_zero_is_rejected(feature_project: Path):
    page = BddService(str(feature_project)).get_scenario(0)
    assert "out of range" in page["error"]
    assert "scenario" not in page


def test_non_numeric_page_is_rejected(feature_project: Path):
    assert "whole number" in BddService(str(feature_project)).get_scenario("two")["error"]


def test_missing_feature_file_is_reported(tmp_path: Path):
    page = BddService(str(tmp_path)).get_scenario(1)
    assert "No feature file found" in page["error"]
    assert page["total_pages"] == 0


def test_feature_file_without_scenarios_is_reported(tmp_path: Path):
    (tmp_path / "agent_bdd.feature").write_text("Feature: Empty\n", encoding="utf-8")
    assert "No scenarios found" in BddService(str(tmp_path)).get_scenario(1)["error"]


def test_configured_path_is_preferred(tmp_path: Path):
    custom = tmp_path / "specs" / "custom.feature"
    custom.parent.mkdir()
    custom.write_text(FEATURE, encoding="utf-8")
    service = BddService(str(tmp_path), feature_path="specs/custom.feature")
    assert service.get_scenario(1)["feature_file"] == str(custom)


def test_the_projects_own_feature_file_paginates(tmp_path: Path):
    """The shipped agent_bdd.feature must actually be walkable."""
    root = Path(__file__).resolve().parents[3]
    service = BddService(str(root))
    summary = service.summary()
    assert summary["total_scenarios"] > 20
    assert summary["has_background"] is True

    last = service.get_scenario(summary["total_scenarios"])
    assert last["has_next"] is False
    for page_number in (1, summary["total_scenarios"] // 2, summary["total_scenarios"]):
        page = service.get_scenario(page_number)
        assert page["scenario"]["name"]
        assert page["background"]
