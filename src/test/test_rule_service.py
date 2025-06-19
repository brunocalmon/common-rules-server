import pytest
from unittest.mock import patch, MagicMock
from common_rules_server.service.rule_service import RuleService

@patch("common_rules_server.service.rule_service.Path")
@patch("common_rules_server.service.rule_service.parse_yaml_header_and_body")
def test_load_rules(mock_parse_yaml, mock_path):
    mock_dir = MagicMock()
    mock_path.return_value = mock_dir
    mock_dir.exists.return_value = True
    mock_dir.is_dir.return_value = True
    mock_dir.rglob.return_value = [MagicMock(stem="test_rule", read_text=MagicMock(return_value=""))]
    mock_parse_yaml.return_value = ( {"type": "Always", "description": "desc"}, "body" )
    service = RuleService("/fake/dir")
    rules = service.load_rules()
    assert isinstance(rules, list)
    assert rules[0]["header"]["type"] == "Always"
    assert rules[0]["header"]["description"] == "desc"

@patch.object(RuleService, "load_rules")
def test_get_user_rules(mock_load_rules):
    mock_load_rules.return_value = [
        {"key": "test-rule", "header": {"type": "Always", "description": "desc"}, "body": "body", "file": None, "to_text_content": lambda: MagicMock(text="test content")}
    ]
    service = RuleService("/fake/dir")
    result = service.get_user_rules()
    assert isinstance(result, list)
    assert hasattr(result[0], "text") 