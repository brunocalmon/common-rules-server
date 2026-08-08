import pytest
from common_rules_server.service.resource_service import ResourceService
from common_rules_server.service.config_service import ConfigService

def test_default_kit_integrity():
    config_service = ConfigService()
    # By default it will load the built-ins from src/common_rules_server/resources/
    resource_service = ResourceService(config_service)
    
    context = resource_service.get_context()
    
    # 30 original + 3 bdd skills + 1 qa-engineer agent + 1 bdd-cycle workflow = 35
    assert len(context) == 35, f"Expected 35 resources, found {len(context)}"
    
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
    
    # Assert specific counts
    assert counts["rule"] == 2
    assert counts["skill"] == 24  # 16 core + 5 optional + 3 bdd = 24
    assert counts["agent"] == 4   # 3 original + 1 qa-engineer = 4
    assert counts["workflow"] == 4 # 3 original + 1 bdd-cycle = 4
    assert counts["loop"] == 1
    
    # Total = 2 + 24 + 4 + 4 + 1 = 35

