---
kind: skill
name: deviation
description: >-
  Record a deliberate departure from the documented process or requirements, with
  its reasoning. Available when deviation tracking is enabled.
trigger: model-invoked
gate: ENABLE_DEVIATION
relationships:
  comes-from:
    - target: /compliance
      required: false
  output: templates/deviation.md
env:
  optional: [WIKI_DIR]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /compliance | no | A requirement was not met |
| output | templates/deviation.md | yes | Deviation record |

## Instructions

Record what was departed from, why, what was done instead, and what it costs.

**Ask before deviating, record after.** A deviation agreed in advance is a
decision; one recorded afterwards is a notification. Where the departure is
already made, say so plainly rather than writing it as though it had been
proposed.

Every record states its cost. A deviation with no stated downside was either not
a deviation or has not been thought through, and the cost is what a reader needs
in order to decide whether to accept it again.

Note whether it is a one-off or something the process should absorb. Repeated
deviations in the same place are a sign the documented process is wrong, and
that is worth acting on rather than working around each time.
