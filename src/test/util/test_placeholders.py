"""Placeholder resolution.

The bug these guard against: resources are authored as ``{{KEY}}`` while an
earlier resolver looked for ``{{ KEY }}``. Nothing raised, nothing logged — every
resource simply reached the agent with its placeholders intact, and the whole
configuration layer was inert.
"""

from common_rules_server.util import placeholders


def test_resolves_the_syntax_resources_are_actually_written_in():
    text, used, unresolved = placeholders.resolve(
        "Run {{TEST_COMMAND}} now.", {"TEST_COMMAND": "pytest"}
    )
    assert text == "Run pytest now."
    assert used == {"TEST_COMMAND": "pytest"}
    assert unresolved == []


def test_also_resolves_the_spaced_variant():
    text, _, _ = placeholders.resolve("Run {{ TEST_COMMAND }}.", {"TEST_COMMAND": "pytest"})
    assert text == "Run pytest."


def test_unknown_keys_are_left_intact_and_reported():
    """Report templates share this syntax for their fill-in slots.

    Substituting or blanking them would destroy the template, so an unknown key
    must survive untouched.
    """
    text, used, unresolved = placeholders.resolve("Status: {{STATUS}}", {"WIKI_DIR": ".docs"})
    assert text == "Status: {{STATUS}}"
    assert used == {}
    assert unresolved == ["STATUS"]


def test_a_key_present_but_empty_counts_as_unresolved():
    """An empty command is not a command.

    Blanking the placeholder would leave the agent an instruction to run nothing,
    which reads as valid and is not.
    """
    text, used, unresolved = placeholders.resolve("Run {{TEST_COMMAND}}.", {"TEST_COMMAND": ""})
    assert text == "Run {{TEST_COMMAND}}."
    assert used == {}
    assert unresolved == ["TEST_COMMAND"]


def test_whitespace_only_value_is_also_unresolved():
    _, _, unresolved = placeholders.resolve("{{X}}", {"X": "   "})
    assert unresolved == ["X"]


def test_multiple_occurrences_all_replaced_and_reported_once():
    text, used, unresolved = placeholders.resolve(
        "{{A}} then {{A}} then {{B}}", {"A": "1"}
    )
    assert text == "1 then 1 then {{B}}"
    assert used == {"A": "1"}
    assert unresolved == ["B"]


def test_lowercase_markers_are_not_treated_as_placeholders():
    text, _, unresolved = placeholders.resolve("{{lower}}", {"lower": "x"})
    assert text == "{{lower}}"
    assert unresolved == []


def test_find_placeholders_lists_referenced_keys():
    assert placeholders.find_placeholders("{{A}} {{B}} {{A}}") == {"A", "B"}
    assert placeholders.find_placeholders("") == set()


def test_empty_text_is_handled():
    assert placeholders.resolve("", {"A": "1"}) == ("", {}, [])
