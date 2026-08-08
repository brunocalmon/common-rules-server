import pytest
from common_rules_server.util.resource_parsing import parse_resource_file

def test_parse_valid_resource():
    text = """---
kind: skill
name: my-skill
description: A test skill
relationships:
  goes-to:
    - target: /verify
      required: true
env:
  requires: [TEST_COMMAND]
---
## Instructions
Run something.
"""
    header, body = parse_resource_file(text)
    assert header is not None
    assert header['kind'] == 'skill'
    assert header['name'] == 'my-skill'
    assert header['description'] == 'A test skill'
    assert 'goes-to' in header['relationships']
    assert header['env']['requires'] == ['TEST_COMMAND']
    assert header['env']['optional'] == []
    assert "## Instructions\nRun something." in body

def test_parse_missing_required_fields():
    text = """---
name: my-skill
---
body here
"""
    header, body = parse_resource_file(text)
    assert header is None
    assert body is None

def test_parse_defaults_applied():
    text = """---
kind: rule
name: my-rule
description: A test rule
---
body here
"""
    header, body = parse_resource_file(text)
    assert header is not None
    assert header['relationships'] == {}
    assert header['env']['requires'] == []
    assert header['env']['optional'] == []

def test_parse_invalid_yaml():
    text = """---
kind: rule
name: [unclosed list
---
body here
"""
    header, body = parse_resource_file(text)
    assert header is None
    assert body is None

def test_parse_no_frontmatter():
    text = """# Just Markdown
No frontmatter here.
"""
    header, body = parse_resource_file(text)
    assert header is None
    assert body is None
