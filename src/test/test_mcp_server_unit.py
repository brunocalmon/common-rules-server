import pytest
from unittest.mock import patch, MagicMock
from common_rules_server.mcp_server import get_rule_type, get_rule_description, get_rules_summary


def test_get_rule_type():
    header = {"type": "Always"}
    assert get_rule_type(header) == "Always"
    header = {}
    assert get_rule_type(header) == ""

def test_get_rule_description():
    header = {"description": "desc"}
    assert get_rule_description(header) == "desc"
    header = {}
    assert get_rule_description(header) == ""

@patch("common_rules_server.mcp_server.parse_yaml_header_and_body")
@patch("common_rules_server.mcp_server.Path")
def test_get_rules_summary(mock_path, mock_parse_yaml):
    # Setup mock directory and files
    mock_dir = MagicMock()
    mock_path.exists.return_value = True
    mock_path.is_dir.return_value = True
    mock_path.rglob.return_value = [MagicMock(stem="test_rule", read_text=MagicMock(return_value=""))]
    mock_parse_yaml.return_value = ( {"type": "Always", "description": "desc", "artifacts": []}, "body" )
    rules = get_rules_summary(mock_path)
    assert isinstance(rules, list)
    assert rules[0]["key"] == "test-rule"
    assert rules[0]["type"] == "Always"
    assert rules[0]["description"] == "desc" 