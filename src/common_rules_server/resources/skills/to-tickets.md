---
kind: skill
name: to-tickets
description: >-
  Break a plan or specification into ordered, independently verifiable tickets.
  Use when work is agreed and needs decomposing.
trigger: user-invoked
relationships:
  comes-from:
    - target: /to-spec
      required: false
  output: templates/to-tickets.md
env:
  optional: [DOCS_DIR, WIKI_DIR]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /to-spec | no | Tickets from a spec |
| output | templates/to-tickets.md | yes | Ticket breakdown |

## Instructions

Slice the work vertically. Each ticket cuts a narrow but complete path through
every layer it touches — storage, logic, interface, tests — and leaves the
system working.

Horizontal slices ("all the models", then "all the endpoints") are the default
failure here. They cannot be demonstrated, cannot be reviewed meaningfully, and
hide integration problems until the last slice.

Each ticket states:

- What it delivers, in terms of observable behaviour.
- What must be done before it can start.
- How it will be verified.

Size each to fit one working session end to end. A ticket that cannot be
finished in a sitting will be left half-done, and half-done vertical slices are
worse than horizontal ones.

Present the ordered list and ask whether the granularity is right before writing
anything down. Getting decomposition wrong is cheap to fix now and expensive to
fix after the tickets exist.

Write them where this project tracks work — the tracking section of {{WIKI_DIR}},
or its issue tracker.
