"""Parser for the unified resource format.

Every resource — rule, skill, agent, workflow, loop — is a Markdown file with a
YAML frontmatter block. This module is the single place that knows how to turn
such a file into a dict, and the single place that decides whether a file is a
valid resource at all.

Parsing never raises. It returns a ``ParsedResource`` carrying either a header
and body, or the reason the file was rejected. Silent ``None`` returns were the
previous behaviour, and they made a broken resource indistinguishable from a
missing one — the integrity test could tell you "29 of 30 loaded" but not which
one failed or why.
"""

import re
from dataclasses import dataclass, field
from typing import Any, Optional

import yaml

VALID_KINDS = ("rule", "skill", "agent", "workflow", "loop")

VALID_RULE_TYPES = ("Always", "Agent Requested", "Auto Attached", "Manual")
VALID_SKILL_TRIGGERS = ("user-invoked", "model-invoked")

# Relationship keys are authored with hyphens in YAML (comes-from) because that
# reads better in the markdown table beside them, but Python callers want
# underscores. Both are accepted; underscores are what comes out.
RELATION_ALIASES = {
    "comes-from": "comes_from",
    "comes_from": "comes_from",
    "goes-to": "goes_to",
    "goes_to": "goes_to",
    "can-invoke": "can_invoke",
    "can_invoke": "can_invoke",
    "uses": "uses",
    "output": "output",
}

# Frontmatter must open on the very first line and close on a line of its own.
# Anchoring the closing delimiter to a line start is what stops a `---` inside a
# YAML value or a markdown horizontal rule from truncating the block.
FRONTMATTER_PATTERN = re.compile(r"\A---[ \t]*\r?\n(.*?)\r?\n---[ \t]*(?:\r?\n|\Z)", re.DOTALL)


@dataclass
class ParsedResource:
    """Outcome of parsing one resource file."""

    header: Optional[dict] = None
    body: Optional[str] = None
    errors: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.errors and self.header is not None


def _normalize_relationships(raw: Any) -> dict:
    """Coerces the relationships block into a predictable shape.

    Edge entries may be written as a bare string (``- /verify``) or as a mapping
    (``- target: /verify``). Both normalize to a mapping so consumers never have
    to type-check. ``output`` stays a scalar because it names a single template.
    """
    if not isinstance(raw, dict):
        return {}

    normalized: dict = {}
    for key, value in raw.items():
        canonical = RELATION_ALIASES.get(str(key).strip().lower())
        if canonical is None:
            continue

        if canonical == "output":
            normalized["output"] = str(value).strip() if value else None
            continue

        edges = []
        for edge in value if isinstance(value, list) else [value]:
            if isinstance(edge, str):
                edges.append({"target": edge.strip(), "required": False, "note": None})
            elif isinstance(edge, dict) and edge.get("target"):
                edges.append(
                    {
                        "target": str(edge["target"]).strip(),
                        "required": bool(edge.get("required", False)),
                        "note": edge.get("note"),
                    }
                )
        if edges:
            normalized[canonical] = edges

    return normalized


def _normalize_env(raw: Any) -> dict:
    """Coerces the env block into ``{"requires": [...], "optional": [...]}``."""
    result = {"requires": [], "optional": []}
    if not isinstance(raw, dict):
        return result

    for key in ("requires", "optional"):
        value = raw.get(key)
        if isinstance(value, str):
            result[key] = [value.strip()]
        elif isinstance(value, list):
            result[key] = [str(v).strip() for v in value if str(v).strip()]

    return result


def parse_resource(text: str) -> ParsedResource:
    """Parses one resource file, collecting every problem rather than the first."""
    if not text or not text.strip():
        return ParsedResource(errors=["file is empty"])

    match = FRONTMATTER_PATTERN.match(text)
    if not match:
        return ParsedResource(
            errors=["missing YAML frontmatter (file must open with '---' on line 1)"]
        )

    try:
        header = yaml.safe_load(match.group(1))
    except yaml.YAMLError as exc:
        return ParsedResource(errors=[f"invalid YAML frontmatter: {exc}"])

    if not isinstance(header, dict):
        return ParsedResource(errors=["frontmatter is not a YAML mapping"])

    errors: list[str] = []

    kind = str(header.get("kind", "")).strip()
    name = str(header.get("name", "")).strip()
    description = str(header.get("description", "")).strip()

    if not kind:
        errors.append("missing required field 'kind'")
    elif kind not in VALID_KINDS:
        errors.append(f"invalid kind '{kind}' (expected one of {', '.join(VALID_KINDS)})")

    if not name:
        errors.append("missing required field 'name'")
    elif not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", name):
        errors.append(f"invalid name '{name}' (expected kebab-case)")

    if not description:
        errors.append("missing required field 'description'")

    # Kind-specific fields. These are warnings-as-errors on purpose: a rule with
    # no type cannot be scheduled, and a skill with no trigger cannot be routed.
    if kind == "rule":
        rule_type = str(header.get("type", "")).strip()
        if not rule_type:
            errors.append("rule is missing required field 'type'")
        elif rule_type not in VALID_RULE_TYPES:
            errors.append(f"invalid rule type '{rule_type}'")

    if kind == "skill":
        trigger = str(header.get("trigger", "")).strip()
        if not trigger:
            errors.append("skill is missing required field 'trigger'")
        elif trigger not in VALID_SKILL_TRIGGERS:
            errors.append(f"invalid skill trigger '{trigger}'")

    if kind == "workflow":
        phases = header.get("phases")
        if not isinstance(phases, list) or not phases:
            errors.append("workflow is missing a non-empty 'phases' list")

    if kind == "loop":
        if not str(header.get("wraps", "")).strip():
            errors.append("loop is missing required field 'wraps'")

    if errors:
        return ParsedResource(errors=errors)

    header["kind"] = kind
    header["name"] = name
    header["description"] = description
    header["relationships"] = _normalize_relationships(header.get("relationships"))
    header["env"] = _normalize_env(header.get("env"))

    return ParsedResource(header=header, body=text[match.end():].lstrip("\n"))


def parse_resource_file(text: str):
    """Backwards-compatible tuple form: ``(header, body)`` or ``(None, None)``."""
    parsed = parse_resource(text)
    return (parsed.header, parsed.body) if parsed.ok else (None, None)
