---
kind: skill
name: bdd-run
description: >-
  Execute BDD scenarios from agent_bdd.feature one at a time.
  The agent reads each scenario via get_bdd_scenario, performs the
  When action, and validates Then assertions against real responses.
trigger: user-invoked
relationships:
  comes-from:
    - target: /bdd-generate
      required: false
      note: Scenarios should exist before running
  goes-to:
    - target: /bdd-review
      required: false
      note: Review failures after run
  output: templates/bdd-run.md
env:
  requires: []
  optional: []
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /bdd-generate | no | Feature file must exist |
| goes-to | /bdd-review | no | Review after run |
| output | templates/bdd-run.md | yes | Test execution report |

## Instructions

Execute every BDD scenario in `agent_bdd.feature` against the live MCP server.

**The loop:**

1. Call `get_bdd_scenario(page=1)` to get the first scenario.
2. Read the scenario's `Given`, `When`, and `Then` steps.
3. **Given** — Verify preconditions (server running, files exist).
4. **When** — Execute the action by calling the appropriate MCP tool
   with the exact arguments specified in the scenario.
5. **Then** — Compare the actual response against every assertion.
   - Field existence checks
   - Exact value matches
   - Type checks (string, object, list)
   - Structural validations (list length, nested keys)
6. Record the result: PASS or FAIL with details.
7. If `has_next` is true, call `get_bdd_scenario(page=N+1)`.
8. Repeat until `has_next` is false.

**Rules:**
- Never skip a scenario. Execute ALL of them.
- Never mock or simulate a tool call. Call the real tool.
- Never assume a response. Compare against the actual output.
- On failure, record the expected vs actual diff and continue to the next scenario.
- At the end, produce a summary report using the output template.
