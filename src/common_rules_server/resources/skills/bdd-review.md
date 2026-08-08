---
kind: skill
name: bdd-review
description: >-
  Review an existing agent_bdd.feature file for completeness,
  contract accuracy, and coverage gaps. Suggest missing scenarios.
trigger: user-invoked
relationships:
  comes-from:
    - target: /bdd-run
      required: false
      note: Review after execution to catch gaps
    - target: /bdd-generate
      required: false
      note: Review after generation for quality
  output: templates/bdd-review.md
env:
  requires: []
  optional: []
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /bdd-run | no | Review failures |
| comes-from | /bdd-generate | no | Review generated file |
| output | templates/bdd-review.md | yes | Review report |

## Instructions

Review the `agent_bdd.feature` file for quality and completeness.

**Checklist:**

1. **Syntax.** Is every scenario valid Gherkin? Are keywords used correctly?
2. **Coverage.** Does every tool/endpoint have at least:
   - One happy-path scenario
   - One error/edge-case scenario
   - One boundary scenario (where applicable)
3. **Contract accuracy.** Are the expected values in `Then` steps
   exact matches of the real tool responses? No placeholders, no approximations.
4. **Relationships.** If the system has cross-references between resources
   (e.g., `/orchestrator` → `/general`), are those validated in scenarios?
5. **Cleanup.** Do scenarios that create side effects (e.g., `create_resource`)
   include cleanup steps?
6. **Missing scenarios.** Suggest any scenarios that should exist but don't.

Produce a review report using the output template.
