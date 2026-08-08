"""Parser behaviour, including the cases that used to fail silently."""

from common_rules_server.util.resource_parsing import parse_resource, parse_resource_file

MINIMAL_SKILL = """---
kind: skill
name: example
description: An example skill.
trigger: user-invoked
---

## Instructions

Do the thing.
"""


def test_parses_a_valid_skill():
    parsed = parse_resource(MINIMAL_SKILL)
    assert parsed.ok
    assert parsed.header["kind"] == "skill"
    assert parsed.header["name"] == "example"
    assert parsed.body.startswith("## Instructions")


def test_body_is_not_truncated_by_a_horizontal_rule():
    """A `---` inside the body must not be read as the frontmatter terminator.

    The previous parser closed the block at the first `---` it found anywhere,
    so any resource whose prose used a horizontal rule lost everything after it.
    """
    text = MINIMAL_SKILL + "\n---\n\nA section after a horizontal rule.\n"
    parsed = parse_resource(text)
    assert parsed.ok
    assert "A section after a horizontal rule." in parsed.body


def test_body_survives_a_yaml_value_containing_dashes():
    text = """---
kind: skill
name: example
description: >-
  A description whose folded block is followed by more keys.
trigger: user-invoked
env:
  optional: [WIKI_DIR]
---

Body text.
"""
    parsed = parse_resource(text)
    assert parsed.ok
    assert parsed.body.strip() == "Body text."
    assert parsed.header["env"]["optional"] == ["WIKI_DIR"]


def test_file_without_frontmatter_is_rejected_with_a_reason():
    parsed = parse_resource("# Just a heading\n\nSome text.\n")
    assert not parsed.ok
    assert "missing YAML frontmatter" in parsed.errors[0]


def test_invalid_yaml_reports_the_yaml_error():
    parsed = parse_resource("---\nkind: skill\n  bad: [indent\n---\nBody\n")
    assert not parsed.ok
    assert "invalid YAML" in parsed.errors[0]


def test_missing_required_fields_are_all_reported_together():
    parsed = parse_resource("---\ntype: Always\n---\nBody\n")
    assert not parsed.ok
    joined = " ".join(parsed.errors)
    assert "'kind'" in joined
    assert "'name'" in joined
    assert "'description'" in joined


def test_unknown_kind_is_rejected():
    parsed = parse_resource(
        "---\nkind: gadget\nname: thing\ndescription: A thing.\n---\nBody\n"
    )
    assert not parsed.ok
    assert "invalid kind 'gadget'" in parsed.errors[0]


def test_non_kebab_case_name_is_rejected():
    parsed = parse_resource(
        "---\nkind: skill\nname: Not_Kebab\ndescription: X.\ntrigger: user-invoked\n---\nB\n"
    )
    assert not parsed.ok
    assert "kebab-case" in parsed.errors[0]


def test_rule_without_a_type_is_rejected():
    parsed = parse_resource("---\nkind: rule\nname: r\ndescription: X.\n---\nB\n")
    assert not parsed.ok
    assert "missing required field 'type'" in " ".join(parsed.errors)


def test_skill_with_an_unknown_trigger_is_rejected():
    parsed = parse_resource(
        "---\nkind: skill\nname: s\ndescription: X.\ntrigger: whenever\n---\nB\n"
    )
    assert not parsed.ok
    assert "invalid skill trigger" in " ".join(parsed.errors)


def test_workflow_without_phases_is_rejected():
    parsed = parse_resource("---\nkind: workflow\nname: w\ndescription: X.\n---\nB\n")
    assert not parsed.ok
    assert "phases" in " ".join(parsed.errors)


def test_loop_without_wraps_is_rejected():
    parsed = parse_resource("---\nkind: loop\nname: l\ndescription: X.\n---\nB\n")
    assert not parsed.ok
    assert "wraps" in " ".join(parsed.errors)


def test_hyphenated_relationship_keys_normalise_to_underscores():
    text = """---
kind: skill
name: example
description: X.
trigger: user-invoked
relationships:
  comes-from:
    - target: /a
      required: true
  goes-to:
    - target: /b
  output: templates/example.md
---
Body
"""
    parsed = parse_resource(text)
    assert parsed.ok
    relationships = parsed.header["relationships"]
    assert relationships["comes_from"] == [
        {"target": "/a", "required": True, "note": None}
    ]
    assert relationships["goes_to"] == [{"target": "/b", "required": False, "note": None}]
    assert relationships["output"] == "templates/example.md"


def test_bare_string_edges_are_accepted():
    text = """---
kind: skill
name: example
description: X.
trigger: user-invoked
relationships:
  can-invoke:
    - /verify
---
Body
"""
    parsed = parse_resource(text)
    assert parsed.ok
    assert parsed.header["relationships"]["can_invoke"] == [
        {"target": "/verify", "required": False, "note": None}
    ]


def test_env_defaults_to_empty_lists():
    parsed = parse_resource(MINIMAL_SKILL)
    assert parsed.header["env"] == {"requires": [], "optional": []}


def test_empty_file_is_rejected():
    assert not parse_resource("").ok
    assert not parse_resource("   \n\n").ok


def test_tuple_form_stays_backwards_compatible():
    header, body = parse_resource_file(MINIMAL_SKILL)
    assert header["name"] == "example"
    assert body.startswith("## Instructions")
    assert parse_resource_file("no frontmatter") == (None, None)
