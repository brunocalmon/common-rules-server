import pytest
from common_rules_server.util.rule_parsing import parse_yaml_header_and_body

def test_parse_yaml_header_and_body_valid():
    text = """---\ndescription: test\ntype: Always\n---\nBody content here"""
    header, body = parse_yaml_header_and_body(text)
    assert isinstance(header, dict)
    assert header["description"] == "test"
    assert header["type"] == "Always"
    assert body.strip() == "Body content here"

def test_parse_yaml_header_and_body_invalid():
    text = "No header here\nJust body"
    header, body = parse_yaml_header_and_body(text)
    assert header is None
    assert body is None 