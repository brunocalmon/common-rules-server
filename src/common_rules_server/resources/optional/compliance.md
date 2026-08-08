---
kind: skill
name: compliance
description: >-
  Check completed work against the requirements it was supposed to satisfy.
  Available when compliance confirmation is enabled.
trigger: model-invoked
gate: ENABLE_COMPLIANCE
relationships:
  comes-from:
    - target: /verify
      required: false
  goes-to:
    - target: /deviation
      required: false
      note: Record an accepted departure rather than hiding it
  output: templates/compliance.md
env:
  optional: [WIKI_DIR]
self_check:
  - Did I treat partial as not met unless the remainder was explicitly accepted?
  - Did I record deviations rather than quietly absorbing them?
  - Did I resist softening the assessment?
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /verify | no | After verification |
| goes-to | /deviation | no | Record an accepted departure |
| output | templates/compliance.md | yes | Compliance report |

## Instructions

Take the requirements this work was meant to satisfy — from the specification,
the ticket, or the wiki at `{{WIKI_DIR}}` — and check each one against what was
actually built.

For each requirement: met, partially met, or not met. Partial counts as not met
unless the remainder is explicitly accepted; "mostly done" is the state in which
work is closed and the gap is discovered by a user.

Where a requirement was deliberately not met, invoke /deviation so the departure
is on the record with its reasoning, rather than absent from it.

Do not soften the assessment. This step exists to catch the gap between intent
and result, and it can only do that if it reports one.
