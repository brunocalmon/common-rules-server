"""The shipped default kit, validated as a whole.

Every file is parsed, every cross-reference resolved, every placeholder checked
against the configuration schema, and every output template confirmed to exist.
These are the failures that no single-file test catches, because a resource can
be perfectly well-formed and still point at something that is not there.
"""

from pathlib import Path

import pytest

from common_rules_server.service.config_service import SCHEMA_BY_NAME
from common_rules_server.util import placeholders
from common_rules_server.util.resource_parsing import (
    VALID_KINDS,
    VALID_RULE_TYPES,
    VALID_SKILL_TRIGGERS,
    parse_resource,
)

RESOURCES = Path(__file__).resolve().parents[1] / "common_rules_server" / "resources"
TEMPLATES = RESOURCES / "templates"

RESOURCE_FILES = sorted(
    path for path in RESOURCES.rglob("*.md") if "templates" not in path.relative_to(RESOURCES).parts
)
TEMPLATE_FILES = sorted(TEMPLATES.glob("*.md"))


def ident(path: Path) -> str:
    return str(path.relative_to(RESOURCES))


def parsed_resources():
    for path in RESOURCE_FILES:
        parsed = parse_resource(path.read_text(encoding="utf-8"))
        assert parsed.ok, f"{ident(path)}: {parsed.errors}"
        yield path, parsed.header, parsed.body


def test_the_kit_is_not_empty():
    assert len(RESOURCE_FILES) >= 40
    assert len(TEMPLATE_FILES) >= 30


@pytest.mark.parametrize("path", RESOURCE_FILES, ids=ident)
def test_every_file_parses(path: Path):
    parsed = parse_resource(path.read_text(encoding="utf-8"))
    assert parsed.ok, f"{ident(path)} failed to parse: {parsed.errors}"


@pytest.mark.parametrize("path", RESOURCE_FILES, ids=ident)
def test_every_file_declares_a_valid_kind_and_kind_specific_fields(path: Path):
    header = parse_resource(path.read_text(encoding="utf-8")).header
    assert header["kind"] in VALID_KINDS
    if header["kind"] == "rule":
        assert header["type"] in VALID_RULE_TYPES
    if header["kind"] == "skill":
        assert header["trigger"] in VALID_SKILL_TRIGGERS
    if header["kind"] == "workflow":
        assert isinstance(header["phases"], list) and header["phases"]
    if header["kind"] == "loop":
        assert header["wraps"]


@pytest.mark.parametrize("path", RESOURCE_FILES, ids=ident)
def test_filename_matches_the_declared_name(path: Path):
    """A mismatch makes a resource unfindable by the name it advertises."""
    header = parse_resource(path.read_text(encoding="utf-8")).header
    assert header["name"] == path.stem


def test_kind_and_name_are_unique_across_the_kit():
    seen: dict[str, str] = {}
    for path, header, _ in parsed_resources():
        key = f"{header['kind']}:{header['name']}"
        assert key not in seen, f"{key} declared by both {seen.get(key)} and {ident(path)}"
        seen[key] = ident(path)


@pytest.mark.parametrize("path", RESOURCE_FILES, ids=ident)
def test_description_is_useful_for_selection(path: Path):
    """The description is the only thing an agent sees when choosing."""
    description = parse_resource(path.read_text(encoding="utf-8")).header["description"]
    assert len(description) >= 40, f"{ident(path)} description is too thin to choose on"


def test_every_reference_points_at_a_resource_that_exists():
    names, edges = set(), []
    for path, header, _ in parsed_resources():
        names.add(f"/{header['name']}")
        relationships = header.get("relationships") or {}
        for relation in ("comes_from", "goes_to", "can_invoke", "uses"):
            for edge in relationships.get(relation, []):
                edges.append((ident(path), relation, edge["target"]))
        for phase in header.get("phases") or []:
            for skill in phase.get("skills") or []:
                edges.append((ident(path), f"phase:{phase.get('name')}", skill))

    dangling = [e for e in edges if e[2].startswith("/") and e[2] not in names]
    assert dangling == [], f"references to resources that do not exist: {dangling}"


def test_every_declared_output_template_exists():
    missing = []
    for path, header, _ in parsed_resources():
        output = (header.get("relationships") or {}).get("output")
        if output and not (TEMPLATES / Path(output).name).is_file():
            missing.append((ident(path), output))
    assert missing == [], f"missing templates: {missing}"


def test_every_placeholder_is_a_real_configuration_key():
    """A placeholder outside the schema can never resolve.

    It would reach the agent as literal braces on every call, and nothing would
    report it — the exact failure mode that made the whole config layer inert.
    """
    unknown = []
    for path, _, body in parsed_resources():
        for key in placeholders.find_placeholders(body):
            if key not in SCHEMA_BY_NAME:
                unknown.append((ident(path), key))
    assert unknown == [], f"placeholders with no configuration key: {unknown}"


def test_declared_env_keys_are_real_configuration_keys():
    unknown = []
    for path, header, _ in parsed_resources():
        env = header.get("env") or {}
        for key in list(env.get("requires", [])) + list(env.get("optional", [])):
            if key not in SCHEMA_BY_NAME:
                unknown.append((ident(path), key))
    assert unknown == [], f"env keys with no schema entry: {unknown}"


def test_gated_resources_gate_on_a_real_configuration_key():
    for path, header, _ in parsed_resources():
        gate = header.get("gate")
        if gate:
            assert gate in SCHEMA_BY_NAME, f"{ident(path)} gates on unknown key {gate}"


def test_optional_resources_are_all_gated():
    """An ungated file under optional/ would load for everyone."""
    for path, header, _ in parsed_resources():
        if path.parent.name == "optional":
            assert header.get("gate"), f"{ident(path)} sits in optional/ but declares no gate"


@pytest.mark.parametrize("path", RESOURCE_FILES, ids=ident)
def test_no_pseudo_code_survives_in_the_kit(path: Path):
    """The rewrite exists to remove this; a regression should fail loudly.

    Hooks are exempt: their shell block is real, executable code rather than
    process described as if it were code, which is what this guards against.
    """
    parsed = parse_resource(path.read_text(encoding="utf-8"))
    if parsed.header["kind"] == "hook":
        pytest.skip("hooks legitimately contain shell code")
    body = parsed.body
    for marker in ("var ", "function(", "return {", "//", "if (", "elif ", "== \"pass\""):
        assert marker not in body, f"{ident(path)} contains pseudo-code marker {marker!r}"


@pytest.mark.parametrize("path", RESOURCE_FILES, ids=ident)
def test_no_editor_is_named_in_the_kit(path: Path):
    """Resources must read the same in every editor."""
    body = parse_resource(path.read_text(encoding="utf-8")).body.lower()
    for editor in ("cursor", "antigravity", "windsurf", "copilot", "claude code", "vs code"):
        assert editor not in body, f"{ident(path)} names the editor {editor!r}"


@pytest.mark.parametrize("path", RESOURCE_FILES, ids=ident)
def test_resources_stay_readable_in_length(path: Path):
    """Long instructions get skimmed, which defeats writing them."""
    body = parse_resource(path.read_text(encoding="utf-8")).body
    assert len(body.splitlines()) <= 90, f"{ident(path)} body is too long to be followed"


@pytest.mark.parametrize("path", RESOURCE_FILES, ids=ident)
def test_every_resource_documents_its_relationships_in_prose(path: Path):
    """The YAML is for the server; the table is what the agent reads inline."""
    header = parse_resource(path.read_text(encoding="utf-8")).header
    body = parse_resource(path.read_text(encoding="utf-8")).body
    if header["kind"] == "hook":
        pytest.skip("hooks declare no relationships")
    if header.get("relationships") or header.get("phases"):
        assert "| " in body, f"{ident(path)} declares relationships but shows no table"


@pytest.mark.parametrize("path", TEMPLATE_FILES, ids=lambda p: p.name)
def test_templates_are_short_and_have_fill_in_slots(path: Path):
    text = path.read_text(encoding="utf-8")
    assert text.startswith("# "), f"{path.name} should open with a heading"
    assert placeholders.find_placeholders(text), f"{path.name} has no fill-in slots"
    assert len(text.splitlines()) <= 30, f"{path.name} is too long for a report skeleton"


def test_no_template_is_orphaned():
    """An unreferenced template is dead weight nobody will maintain."""
    referenced = set()
    for _, header, _ in parsed_resources():
        output = (header.get("relationships") or {}).get("output")
        if output:
            referenced.add(Path(output).name)
    orphans = {p.name for p in TEMPLATE_FILES} - referenced
    assert orphans == set(), f"templates referenced by nothing: {sorted(orphans)}"


def test_the_always_rules_are_present():
    always = {
        header["name"]
        for _, header, _ in parsed_resources()
        if header["kind"] == "rule" and header.get("type") == "Always"
    }
    assert always == {"general", "orchestrator", "self-review", "session-receipt", "auto-approve"}


# ------------------------------------------------------------------ hooks


def test_every_hook_declares_a_canonical_event_and_a_script():
    from common_rules_server.util.resource_parsing import VALID_HOOK_EVENTS, extract_script

    hooks = [(p, h, b) for p, h, b in parsed_resources() if h["kind"] == "hook"]
    assert hooks, "the kit ships no hooks"
    for path, header, body in hooks:
        assert header["event"] in VALID_HOOK_EVENTS, ident(path)
        assert extract_script(body), f"{ident(path)} has no shell block"


def test_every_hook_reaches_at_least_one_editor():
    """A hook no editor supports is an automation that silently never runs."""
    from common_rules_server.service.hook_service import HOOK_TARGETS

    for path, header, _ in parsed_resources():
        if header["kind"] != "hook":
            continue
        supported = [t.key for t in HOOK_TARGETS if header["event"] in t.events]
        assert supported, f"{ident(path)} maps to no editor"


def test_hook_scripts_only_set_the_documented_variables():
    """The wrapper reads `decision` and `message`; anything else is inert."""
    from common_rules_server.util.resource_parsing import extract_script

    for path, header, body in parsed_resources():
        if header["kind"] != "hook":
            continue
        script = extract_script(body)
        assert "decision=" in script, f"{ident(path)} never sets a decision"


# ------------------------------------------------------------- self-check


@pytest.mark.parametrize("path", RESOURCE_FILES, ids=ident)
def test_every_resource_carries_a_self_check(path: Path):
    """The questionnaire is what turns a followed resource into a verified one."""
    header = parse_resource(path.read_text(encoding="utf-8")).header
    questions = header.get("self_check") or []
    assert questions, f"{ident(path)} has no self_check"
    for question in questions:
        # Phrased as a question, so it has to be answered rather than nodded at.
        # A trailing clarification after the question mark is fine.
        assert "?" in question, (
            f"{ident(path)} self_check entry is not a question: {question!r}"
        )
