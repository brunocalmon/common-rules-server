---
kind: skill
name: grill-me
description: >-
  Relentless interview to stress-test a plan, decision, or idea.
  Use when the user wants to validate requirements, or before starting
  non-trivial development work.
trigger: model-invoked
relationships:
  goes-to:
    - target: /to-spec
      required: false
      note: After grilling, may produce a spec
    - target: /dev-process
      required: false
      note: After grilling, may proceed to development
  output: templates/grill-me.md
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| goes-to | /to-spec | no | Produce spec after grilling |
| goes-to | /dev-process | no | Proceed to development |
| output | templates/grill-me.md | yes | Grilling summary |

## Instructions

Interview the user relentlessly until reaching a shared understanding.
Map this as a **decision tree**: every decision branches into decisions
that hang off it.

Work in **rounds**. The **frontier** is every decision whose prerequisites
are settled — the questions askable NOW. Ask the whole frontier in one round.
Number each question and give a recommended answer. Wait for user answers
before the next round.

Format each question:
