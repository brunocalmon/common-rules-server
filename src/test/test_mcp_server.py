import pytest
from pathlib import Path

from common_rules_server.mcp_server import get_context, get_resource, create_resource, setup_config

def test_setup_config():
    config = setup_config()
    assert isinstance(config, dict)

def test_get_context():
    context = get_context()
    assert isinstance(context, list)
    # The default kit has 30 resources.
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
    monkeypatch.setattr(resource_service, "user_dir", tmp_path / ".common-rules")
    
    result = create_resource("skill", "dummy-skill", "A dummy test skill", "## Instructions\nDo something.")
    
    assert "Created skill dummy-skill" in result
    
    file_path = tmp_path / ".common-rules" / "dummy-skill.md"
    assert file_path.exists()
    content = file_path.read_text(encoding="utf-8")
    
    assert "kind: skill" in content
    assert "name: dummy-skill" in content
    assert "## Instructions" in content
