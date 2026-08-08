import pytest
from pathlib import Path

from common_rules_server.mcp_server import get_context, get_resource, create_resource, setup_config, get_bdd_scenario

def test_setup_config():
    config = setup_config()
    assert isinstance(config, dict)

def test_get_context():
    context = get_context()
    assert isinstance(context, list)
    assert len(context) > 0
    # Every item should have kind, name, description
    for item in context:
        assert "kind" in item
        assert "name" in item
        assert "description" in item

def test_get_resource():
    # general rule is always there
    res = get_resource("rule", "general")
    assert isinstance(res, dict)
    assert "Quick workspace health check" in res.get("description", "")
    assert "body" in res

def test_create_resource(tmp_path, monkeypatch):
    from common_rules_server.mcp_server import resource_service
    # Point user dir to a temporary directory so we don't pollute the actual project
    monkeypatch.setattr(resource_service, "user_dir", tmp_path / ".common-rules-server" / "resources")
    
    result = create_resource("skill", "dummy-skill", "A dummy test skill", "## Instructions\nDo something.")
    
    assert "Created skill dummy-skill" in result
    
    file_path = tmp_path / ".common-rules-server" / "resources" / "dummy-skill.md"
    assert file_path.exists()
    content = file_path.read_text(encoding="utf-8")
    
    assert "kind: skill" in content
    assert "name: dummy-skill" in content
    assert "## Instructions" in content

def test_get_bdd_scenario(tmp_path, monkeypatch):
    from common_rules_server.mcp_server import bdd_service
    
    # Create a sample feature file in the tmp dir
    feature_content = """\
Feature: Test
  Scenario: First
    Given something
    When action
    Then result

  Scenario: Second
    Given another
    When action2
    Then result2
"""
    feature_file = tmp_path / "agent_bdd.feature"
    feature_file.write_text(feature_content, encoding="utf-8")
    monkeypatch.setattr(bdd_service, "project_root", tmp_path)
    
    # Page 1
    result = get_bdd_scenario(page=1)
    assert isinstance(result, dict)
    assert result["page"] == 1
    assert result["total_pages"] == 2
    assert result["has_next"] is True
    assert result["scenario"]["name"] == "First"
    
    # Page 2
    result = get_bdd_scenario(page=2)
    assert result["page"] == 2
    assert result["has_next"] is False
    assert result["scenario"]["name"] == "Second"
    
    # Out of range
    result = get_bdd_scenario(page=99)
    assert "error" in result

