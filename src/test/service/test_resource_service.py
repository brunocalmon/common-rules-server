import pytest
from pathlib import Path
from common_rules_server.service.config_service import ConfigService
from common_rules_server.service.resource_service import ResourceService

@pytest.fixture
def test_dirs(tmp_path):
    project_root = tmp_path / "project"
    project_root.mkdir()
    
    built_in = tmp_path / "built-in"
    built_in.mkdir()
    
    # Create built-in rule
    built_in_rule = built_in / "base-rule.md"
    built_in_rule.write_text(
        "---\nkind: rule\nname: test-rule\ndescription: Built-in rule\n---\nBody of built-in rule"
    )
    
    # Create user resources dir
    user_res = project_root / ".common-rules-server" / "resources"
    user_res.mkdir(parents=True, exist_ok=True)
    
    # Create user rule that overrides built-in
    user_rule = user_res / "my-rule.md"
    user_rule.write_text(
        "---\nkind: rule\nname: test-rule\ndescription: User rule\n---\nBody of user rule with {{ BUILD_SYSTEM }}"
    )
    
    # Create another user resource
    user_skill = user_res / "my-skill.md"
    user_skill.write_text(
        "---\nkind: skill\nname: my-skill\ndescription: Custom skill\n---\nBody skill"
    )
    
    return project_root, built_in

def test_resource_service_loading_and_override(test_dirs):
    project_root, built_in = test_dirs
    
    # Fake config
    (project_root / "pyproject.toml").touch()
    config_service = ConfigService(str(project_root))
    
    service = ResourceService(config_service, str(built_in))
    resources = service.load_resources()
    
    # 2 distinct resources loaded (test-rule is overridden)
    assert len(resources) == 2
    
    # The rule should be the user one
    rule = resources["rule:test-rule"]
    assert rule["source"] == "user"
    assert rule["description"] == "User rule"
    assert "Body of user rule with python" in rule["body"]  # Python auto-detected build system
    
    # The skill should exist
    skill = resources["skill:my-skill"]
    assert skill["source"] == "user"
    assert skill["description"] == "Custom skill"

def test_resource_service_get_context(test_dirs):
    project_root, built_in = test_dirs
    config_service = ConfigService(str(project_root))
    service = ResourceService(config_service, str(built_in))
    
    context = service.get_context()
    assert len(context) == 2
    
    # Check progressive disclosure metadata (no body)
    for c in context:
        assert "body" not in c
        assert "kind" in c
        assert "name" in c
        assert "source" in c

def test_resource_service_get_resource(test_dirs):
    project_root, built_in = test_dirs
    config_service = ConfigService(str(project_root))
    service = ResourceService(config_service, str(built_in))
    
    res = service.get_resource("skill", "my-skill")
    assert res is not None
    assert res["body"] == "Body skill"
    
    not_found = service.get_resource("agent", "unknown")
    assert not_found is None
