import pytest
from common_rules_server.service.resource_service import ResourceService
from common_rules_server.service.config_service import ConfigService

def test_default_kit_integrity():
    config_service = ConfigService()
    # By default it will load the built-ins from src/common_rules_server/resources/
    resource_service = ResourceService(config_service)
    
    context = resource_service.get_context()
    
    # We should have exactly 30 resources from the playbook
    assert len(context) == 30, f"Expected 30 resources, found {len(context)}"
    
    counts = {"rule": 0, "skill": 0, "agent": 0, "workflow": 0, "loop": 0}
    
    for meta in context:
        assert "kind" in meta, f"Missing kind in {meta}"
        assert "name" in meta, f"Missing name in {meta}"
        assert "description" in meta, f"Missing description in {meta}"
        
        counts[meta["kind"]] += 1
        
        # Test full loading
        res = resource_service.get_resource(meta["kind"], meta["name"])
        assert res is not None
        assert "body" in res
    
    # Assert specific counts based on the playbook
    assert counts["rule"] == 2
    assert counts["skill"] == 21  # Wait, 16 core skills + 5 optional skills = 21
    assert counts["agent"] == 3
    assert counts["workflow"] == 3
    assert counts["loop"] == 1
    
    # Total = 2 + 21 + 3 + 3 + 1 = 30
