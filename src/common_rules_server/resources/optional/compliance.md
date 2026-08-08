---
kind: skill
name: compliance
description: >-
  Strictly validate code against documented compliance requirements.
  Use when strict adherence to process is mandated.
trigger: model-invoked
relationships:
  goes-to:
    - target: /deviation
      required: false
  output: templates/compliance.md
env:
  requires: [ENABLE_COMPLIANCE]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| goes-to | /deviation | no | If non-compliant |
| output | templates/compliance.md | yes | Compliance report |

## Instructions

If `ENABLE_COMPLIANCE` is false, stop.
Validate the current changes against the project's strict compliance guidelines (typically found in architecture or security docs). Flag any deviations.
