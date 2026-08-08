---
kind: skill
name: deviation
description: >-
  Request and document a deviation from standard processes.
  Use when strict compliance is impossible or counter-productive.
trigger: user-invoked
relationships:
  comes-from:
    - target: /compliance
      required: false
  output: templates/deviation.md
env:
  requires: [ENABLE_DEVIATION]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /compliance | no | Deviation from compliance |
| output | templates/deviation.md | yes | Deviation report |

## Instructions

If `ENABLE_DEVIATION` is false, stop.
Document the exact process being deviated from, the reason why the deviation is necessary, and the plan to mitigate any risks.
