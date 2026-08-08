"""Placeholder resolution for resource bodies.

Resources are written with ``{{KEY}}`` markers. Two distinct families of marker
share that syntax and must not be confused:

* **Config placeholders** — keys the config layer knows about (``{{TEST_COMMAND}}``).
  These are replaced with their resolved values before the body reaches the agent.
* **Report placeholders** — fill-in slots inside output templates
  (``{{STATUS}}``, ``{{PASS_RATE}}``). The agent fills these in when it writes a
  report, so they must survive resolution untouched.

The rule that keeps the two apart is simple: only replace a marker when its key
exists in the supplied config. Everything else is left verbatim and reported as
unresolved so callers can surface it.
"""

import re

# Matches {{KEY}} and {{ KEY }}. Keys are upper snake case, which is what the
# config layer emits and what every resource is authored against.
PLACEHOLDER_PATTERN = re.compile(r"\{\{\s*([A-Z][A-Z0-9_]*)\s*\}\}")


def find_placeholders(text: str) -> set[str]:
    """Returns every placeholder key referenced in ``text``."""
    if not text:
        return set()
    return set(PLACEHOLDER_PATTERN.findall(text))


def resolve(text: str, config: dict) -> tuple[str, dict, list[str]]:
    """Substitutes known config placeholders in ``text``.

    Returns ``(resolved_text, used, unresolved)`` where ``used`` maps the keys
    that were substituted to the values used, and ``unresolved`` lists keys that
    were referenced but are absent from ``config`` or resolved to an empty value.

    A key present in config but holding an empty string counts as unresolved: an
    empty ``TEST_COMMAND`` is not a usable command, and silently blanking the
    placeholder would leave the agent with an instruction to "run" nothing.
    """
    if not text:
        return text, {}, []

    used: dict[str, str] = {}
    unresolved: list[str] = []

    def substitute(match: re.Match) -> str:
        key = match.group(1)
        if key not in config:
            if key not in unresolved:
                unresolved.append(key)
            return match.group(0)

        value = config[key]
        if value is None or str(value).strip() == "":
            if key not in unresolved:
                unresolved.append(key)
            return match.group(0)

        used[key] = str(value)
        return str(value)

    return PLACEHOLDER_PATTERN.sub(substitute, text), used, unresolved
