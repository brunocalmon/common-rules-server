"""Named managed blocks.

The bug these exist for: setup and sync both write CLAUDE.md, and with a single
shared marker the second write silently erased the first.
"""

from common_rules_server.util import managed_blocks as mb


def test_creates_a_block_in_an_empty_file():
    result = mb.merge("", "hello", "guidance")
    assert mb.start_marker("guidance") in result
    assert "hello" in result


def test_appends_below_existing_user_content():
    result = mb.merge("# Mine\n\nMy notes.\n", "hello", "guidance")
    assert "My notes." in result
    assert result.index("My notes.") < result.index("hello")


def test_replaces_in_place_rather_than_appending():
    once = mb.merge("", "first", "guidance")
    twice = mb.merge(once, "second", "guidance")

    assert twice.count(mb.start_marker("guidance")) == 1
    assert "second" in twice
    assert "first" not in twice


def test_two_differently_named_blocks_coexist():
    """The whole reason blocks are named."""
    text = mb.merge("", "the guidance", "guidance")
    text = mb.merge(text, "the resources", "resources")

    assert "the guidance" in text
    assert "the resources" in text
    assert set(mb.block_names(text)) == {"guidance", "resources"}


def test_rewriting_one_block_leaves_the_other_untouched():
    text = mb.merge(mb.merge("", "the guidance", "guidance"), "the resources", "resources")
    text = mb.merge(text, "new resources", "resources")

    assert "the guidance" in text
    assert "new resources" in text
    assert "the resources" not in text


def test_order_of_writes_does_not_matter():
    a = mb.merge(mb.merge("", "GUIDANCE-BODY", "guidance"), "RESOURCES-BODY", "resources")
    b = mb.merge(mb.merge("", "RESOURCES-BODY", "resources"), "GUIDANCE-BODY", "guidance")
    for text in (a, b):
        assert "GUIDANCE-BODY" in text and "RESOURCES-BODY" in text


def test_prefix_applies_only_to_a_new_file():
    created = mb.merge("", "body", "guidance", prefix="---\nx: 1\n---\n")
    assert created.startswith("---\nx: 1\n---\n")

    updated = mb.merge(created, "body2", "guidance", prefix="---\nx: 1\n---\n")
    assert updated.count("x: 1") == 1


def test_strip_removes_only_the_named_block():
    text = mb.merge(mb.merge("# Mine\n", "GUIDANCE-BODY", "guidance"), "RESOURCES-BODY", "resources")
    stripped = mb.strip(text, "guidance")

    assert "# Mine" in stripped
    assert "RESOURCES-BODY" in stripped
    assert "GUIDANCE-BODY" not in stripped


def test_strip_is_a_no_op_when_absent():
    assert mb.strip("# Mine\n", "guidance") == "# Mine\n"


def test_user_content_below_a_block_survives():
    text = mb.merge("", "GUIDANCE-BODY", "guidance") + "\nTrailing note.\n"
    updated = mb.merge(text, "GUIDANCE-BODY-2", "guidance")
    assert "Trailing note." in updated
