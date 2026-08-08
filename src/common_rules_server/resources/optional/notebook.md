---
kind: skill
name: notebook
description: >-
  Record decisions and their reasoning in dated notebook entries as work
  happens. Available when notebook tracking is enabled.
trigger: model-invoked
gate: ENABLE_NOTEBOOKS
relationships:
  goes-to:
    - target: /daily-logbook
      required: false
      note: Entries roll up into the daily summary
  output: templates/notebook.md
env:
  optional: [NOTEBOOK_DIR]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| goes-to | /daily-logbook | no | Entries roll up into the summary |
| output | templates/notebook.md | yes | Notebook entry |

## Instructions

Write an entry to `{{NOTEBOOK_DIR}}` when something is decided that a reader six
months from now could not reconstruct from the code.

Worth an entry: a decision and the alternatives rejected, a constraint
discovered the hard way, a dead end and why it was one, an assumption the work
now rests on.

Not worth an entry: what changed — the commit history already holds that, and
duplicating it is how a notebook becomes noise nobody reads.

Each entry: the date, what was decided, why, and what was ruled out. Keep it
short. The reasoning is the payload; the narrative is not.
