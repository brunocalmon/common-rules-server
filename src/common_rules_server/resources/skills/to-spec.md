---
kind: skill
name: to-spec
description: >-
  Turn the current conversation into a structured spec.
  Use when requirements are settled and need to be documented.
trigger: user-invoked
relationships:
  comes-from:
    - target: /grill-me
      required: false
  goes-to:
    - target: /to-tickets
      required: false
  output: templates/to-spec.md
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /grill-me | no | Spec from grilled requirements |
| goes-to | /to-tickets | no | Break spec into tickets |
| output | templates/to-spec.md | yes | Spec document |

## Instructions

Synthesize the current conversation into a spec. Do NOT interview — just
synthesize what you already know.

Sections:
1. **Problem statement** — from the user's perspective.
2. **Solution** — from the user's perspective.
3. **User stories** — extensive numbered list.
4. **Implementation decisions** — modules, interfaces, architecture. No file paths.
5. **Testing decisions** — what to test, at which seams, prior art.
6. **Out of scope** — what this spec does NOT cover.