---
kind: skill
name: bdd-generate
description: >-
  Generate an agent_bdd.feature file for the current project.
  Uses /grill-me to interrogate requirements before writing scenarios.
  Each scenario must use exact, real contract data — no mocks, no truncation.
trigger: user-invoked
relationships:
  comes-from:
    - target: /grill-me
      required: true
      note: Requirements must be grilled before generating scenarios
  goes-to:
    - target: /bdd-review
      required: false
      note: Review generated scenarios for completeness
  output: templates/bdd-generate.md
env:
  requires: []
  optional: [BDD_FILE_PATH]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /grill-me | yes | Grill requirements before writing |
| goes-to | /bdd-review | no | Review after generation |
| output | templates/bdd-generate.md | yes | Generation report |

## Instructions

Generate a `agent_bdd.feature` file in Gherkin syntax at `{{BDD_FILE_PATH}}` (default: project root).

**Before writing any scenario:**

1. **Grill.** Invoke `/grill-me` to interrogate the user about what the system does,
   what the tools accept, and what the exact expected responses look like.
   Do NOT proceed until requirements are fully understood.

2. **Discover contracts.** For each tool or endpoint:
   - Call it with known inputs and capture the exact response shape.
   - Record every field, every value, every edge case.
   - Never abbreviate, truncate, mock, or assume any part of the response.

3. **Write scenarios.** For each tool/endpoint, write scenarios covering:
   - Happy path with exact expected response
   - Edge cases (missing args, invalid inputs, empty results)
   - Boundary conditions (first page, last page, out of range)

**Gherkin conventions:**
- Use `Feature:` to group related scenarios by tool/endpoint.
- Use `Scenario:` for each independent test case.
- Use `Given` for preconditions (server running, file exists).
- Use `When` for the action (calling the tool with specific args).
- Use `Then` for assertions (exact field values, types, structures).
- Use `And` for additional assertions.
- Include Doc Strings (triple quotes) for large expected payloads.
