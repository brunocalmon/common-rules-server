import pytest
from common_rules_server.domain.rule import RuleFactory, AlwaysRule, AgentRequestedRule, AutoAttachedRule, ManualRule

@pytest.mark.parametrize("header,body,expected_type,expected_output", [
    # Always rule
    ({'alwaysApply': 'true', 'description': '', 'globs': ''}, 'ALWAYS BODY', AlwaysRule, 'always-body:\nALWAYS BODY'),
    # Agent Requested rule
    ({'alwaysApply': 'false', 'description': 'desc', 'globs': ''}, 'AGENT BODY', AgentRequestedRule, 'agent-requested: desc'),
    # Auto Attached rule
    ({'alwaysApply': 'false', 'description': '', 'globs': '*.tsx'}, 'AUTO BODY', AutoAttachedRule, 'auto-attached: The rule is auto-attached when files matching the pattern are referenced or edited. [globs: *.tsx]'),
    # Manual rule
    ({'alwaysApply': 'false', 'description': '', 'globs': ''}, 'MANUAL BODY', ManualRule, 'manual'),
])
def test_rule_factory_types(header, body, expected_type, expected_output):
    key = expected_output.split(':')[0] if ':' in expected_output else expected_output.lower().replace(' ', '-')
    rule = RuleFactory.from_header(key, header, body, file=None)
    assert isinstance(rule, expected_type)
    output = rule.to_text_content().text
    # For agent requested and auto attached, output includes key
    if expected_type in (AgentRequestedRule, AutoAttachedRule):
        assert output.startswith(key)
    # For always/manual, output is just the body or key
    if expected_type is AlwaysRule or expected_type is ManualRule:
        assert output == expected_output 