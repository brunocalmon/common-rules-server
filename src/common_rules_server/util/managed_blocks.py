"""Managed regions inside files the user also edits.

Several files are written by this server *and* owned by the user — ``CLAUDE.md``,
``AGENTS.md``, an editor's rules file. Writing them wholesale would destroy the
user's content, so each write is confined to a delimited block.

Blocks are **named**. That is the part that matters: two different features can
write to the same file, and with a shared marker the second silently replaced
the first. Setup writes orchestration guidance into ``CLAUDE.md`` and sync writes
the always-applied rules into the same file; with one marker between them, syncing
erased the guidance that tells the agent how to work, and nothing reported it.
"""

import re

_NEWLINE = "\n"

_START = "<!-- BEGIN common-rules:{name} (managed — edits inside are overwritten) -->"
_END = "<!-- END common-rules:{name} -->"


def start_marker(name: str) -> str:
    return _START.format(name=name)


def end_marker(name: str) -> str:
    return _END.format(name=name)


def merge(existing: str, content: str, name: str, prefix: str = "") -> str:
    """Inserts or replaces the named block, leaving everything else intact.

    ``prefix`` is written only when the file is being created, for editors whose
    rules files need frontmatter at the top.
    """
    start, end = start_marker(name), end_marker(name)
    block = f"{start}\n{content.strip()}\n{end}\n"

    if start in existing and end in existing:
        head, _, rest = existing.partition(start)
        _, _, tail = rest.partition(end)
        return f"{head}{block}{tail.lstrip(_NEWLINE)}"

    if not existing.strip():
        return f"{prefix}{block}"

    return f"{existing.rstrip()}\n\n{block}"


def strip(existing: str, name: str) -> str:
    """Removes the named block and nothing else."""
    start, end = start_marker(name), end_marker(name)
    if start not in existing or end not in existing:
        return existing
    head, _, rest = existing.partition(start)
    _, _, tail = rest.partition(end)
    return f"{head.rstrip()}\n{tail.lstrip()}".strip() + "\n"


def block_names(text: str) -> list[str]:
    """Every managed block present in ``text``."""
    return re.findall(r"<!-- BEGIN common-rules:([a-z-]+)", text)
