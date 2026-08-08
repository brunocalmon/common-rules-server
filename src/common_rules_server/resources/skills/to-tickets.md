---
kind: skill
name: to-tickets
description: >-
  Break a plan, spec, or conversation into tracer-bullet tickets.
  Use when work needs to be decomposed into implementable slices.
trigger: user-invoked
relationships:
  comes-from:
    - target: /to-spec
      required: false
  output: templates/to-tickets.md
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /to-spec | no | Tickets from spec |
| output | templates/to-tickets.md | yes | Ticket list |

## Instructions

Break work into **tracer bullet** vertical slices.

Each slice:
- Cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests).
- Is demoable or verifiable on its own.
- Is sized to fit in a single agent context window.

Give each ticket blocking edges — which tickets must complete first.

Present as numbered list with: title, blocked by, what it delivers.
Ask the user if granularity is right. Iterate until approved.

Write tickets to {{DOCS_DIR}}/tickets/ or the project's issue tracker.