import pytest
from pathlib import Path
from common_rules_server.service.bdd_service import BddService


SAMPLE_FEATURE = """\
Feature: Sample Feature
  A sample feature for testing.

  Scenario: First scenario
    Given the server is running
    When I call tool_a
    Then I get result_a

  Scenario: Second scenario
    Given the server is running
    When I call tool_b
    Then I get result_b

  Scenario: Third scenario
    Given something exists
    When I do something
    Then something happens
"""


@pytest.fixture
def bdd_service_with_feature(tmp_path):
    """Creates a BddService pointing at a tmp dir with a sample .feature file."""
    feature_file = tmp_path / "agent_bdd.feature"
    feature_file.write_text(SAMPLE_FEATURE, encoding="utf-8")
    return BddService(project_root=str(tmp_path))


@pytest.fixture
def bdd_service_empty(tmp_path):
    """Creates a BddService pointing at a tmp dir without a .feature file."""
    return BddService(project_root=str(tmp_path))


class TestBddServiceParsing:
    def test_parses_three_scenarios(self, bdd_service_with_feature):
        result = bdd_service_with_feature.get_scenario(page=1)
        assert result["total_pages"] == 3

    def test_first_scenario_name(self, bdd_service_with_feature):
        result = bdd_service_with_feature.get_scenario(page=1)
        assert result["scenario"]["name"] == "First scenario"

    def test_second_scenario_name(self, bdd_service_with_feature):
        result = bdd_service_with_feature.get_scenario(page=2)
        assert result["scenario"]["name"] == "Second scenario"

    def test_third_scenario_name(self, bdd_service_with_feature):
        result = bdd_service_with_feature.get_scenario(page=3)
        assert result["scenario"]["name"] == "Third scenario"

    def test_scenario_body_contains_steps(self, bdd_service_with_feature):
        result = bdd_service_with_feature.get_scenario(page=1)
        body = result["scenario"]["body"]
        assert "Given the server is running" in body
        assert "When I call tool_a" in body
        assert "Then I get result_a" in body


class TestBddServicePagination:
    def test_page_1_has_next(self, bdd_service_with_feature):
        result = bdd_service_with_feature.get_scenario(page=1)
        assert result["has_next"] is True
        assert result["page"] == 1

    def test_page_2_has_next(self, bdd_service_with_feature):
        result = bdd_service_with_feature.get_scenario(page=2)
        assert result["has_next"] is True
        assert result["page"] == 2

    def test_last_page_no_next(self, bdd_service_with_feature):
        result = bdd_service_with_feature.get_scenario(page=3)
        assert result["has_next"] is False
        assert result["page"] == 3

    def test_page_zero_returns_error(self, bdd_service_with_feature):
        result = bdd_service_with_feature.get_scenario(page=0)
        assert "error" in result
        assert "out of range" in result["error"]

    def test_page_beyond_total_returns_error(self, bdd_service_with_feature):
        result = bdd_service_with_feature.get_scenario(page=999)
        assert "error" in result
        assert "out of range" in result["error"]


class TestBddServiceMissingFile:
    def test_no_feature_file_returns_error(self, bdd_service_empty):
        result = bdd_service_empty.get_scenario(page=1)
        assert "error" in result
        assert "not found" in result["error"]
        assert result["total_pages"] == 0

    def test_empty_feature_file_returns_error(self, tmp_path):
        feature_file = tmp_path / "agent_bdd.feature"
        feature_file.write_text("Feature: Empty\n  No scenarios here.\n", encoding="utf-8")
        service = BddService(project_root=str(tmp_path))
        result = service.get_scenario(page=1)
        assert "error" in result
        assert "No scenarios" in result["error"]
