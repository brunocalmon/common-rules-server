---
kind: skill
name: dev-process
description: >-
  Development workflow — docs check, implementation, verification.
  Use when the user wants to implement a feature or fix.
trigger: model-invoked
relationships:
  comes-from:
    - target: /grill-me
      required: false
      note: Requirements should be grilled first for non-trivial work
    - target: /orchestrator
      required: false
  goes-to:
    - target: /verify
      required: true
  can-invoke:
    - target: /tdd
      required: false
      note: If project has tests
    - target: /docs
      required: false
      note: If behavior changed
  output: templates/dev-process.md
env:
  optional: [README_PATH, ARCHITECTURE_PATH]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /grill-me | no | Requirements grilling |
| comes-from | /orchestrator | no | Default workflow |
| goes-to | /verify | yes | Always verify after dev |
| can-invoke | /tdd | no | If project has tests |
| can-invoke | /docs | no | If behavior changed |
| output | templates/dev-process.md | yes | Dev report |

## Instructions

Before writing code, confirm:

1. {{README_PATH}} and {{ARCHITECTURE_PATH}} exist and describe the dev workflow.
2. If either is missing or unclear, ask — do not assume.

Follow the documented development process. If the project uses TDD, invoke /tdd.
If not, implement directly and then invoke /verify.

When done, check if documentation needs updating. If the change altered behavior,
public API, or architecture, invoke /docs.

Self-check: Were requirements gathered? If this is non-trivial work and no
grilling was done, flag it to the user and offer /grill-me.