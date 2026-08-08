---
kind: skill
name: to-spec
description: >-
  Turn a settled conversation into a written specification. Use once the
  requirements are agreed and need to survive the session.
trigger: user-invoked
relationships:
  comes-from:
    - target: /grill-me
      required: false
      note: The spec records what the grilling settled
  goes-to:
    - target: /to-tickets
      required: false
  output: templates/to-spec.md
env:
  optional: [WIKI_DIR]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /grill-me | no | Records what grilling settled |
| goes-to | /to-tickets | no | Break the spec into work |
| output | templates/to-spec.md | yes | Specification |

## Instructions

Synthesise what has already been decided. Do not interview here — if questions
remain open, the conversation was not finished and /grill-me should run again.

Cover:

1. **Problem.** Stated from the user's position, not the system's.
2. **Solution.** What will exist afterwards that does not now.
3. **User stories.** Numbered, specific, and complete enough to disagree with.
4. **Implementation decisions.** Modules, interfaces, data shapes, and the
   reasoning. Name components, not file paths — paths change and reasoning does
   not.
5. **Testing decisions.** What is verified, at which seam, and what prior art
   the project already has for it.
6. **Out of scope.** What this deliberately does not cover. This section
   prevents more disagreement than any other.

Record open questions as open. A spec that quietly resolves an unsettled
question turns an unmade decision into an invisible one.

Write it into {{WIKI_DIR}} where the project keeps its specifications.
