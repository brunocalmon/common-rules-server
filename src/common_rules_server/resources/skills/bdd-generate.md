---
kind: skill
name: bdd-generate
description: >-
  Write agent-executable acceptance scenarios in Gherkin, using exact real
  contracts. Use when a system needs behavioural coverage an agent can carry out
  directly.
trigger: user-invoked
relationships:
  comes-from:
    - target: /grill-me
      required: true
      note: Scenarios are only as good as the behaviour they were derived from
  goes-to:
    - target: /bdd-run
      required: false
  output: templates/bdd-generate.md
env:
  optional: [BDD_FILE_PATH]
self_check:
  - Is every contract exact — nothing abbreviated, elided, approximated or mocked?
  - Did I grill the behaviour first, or write scenarios against an assumed contract?
  - Did I capture unknown shapes by calling the real thing?
  - Are there error and boundary scenarios, or only happy paths?
  - Can each scenario run alone, without depending on a previous one?
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /grill-me | yes | Behaviour must be settled first |
| goes-to | /bdd-run | no | Execute what was written |
| output | templates/bdd-generate.md | yes | Generation report |

## Instructions

Write scenarios an agent can execute by hand, against the running system, with
no test framework involved.

**Interrogate before writing.** Invoke /grill-me to settle what the system is
supposed to do. This edge is required, and the reason is specific: scenarios
written from an assumed contract encode the assumption and then pass, which is
worse than having no scenarios because it manufactures confidence.

**Use exact contracts. Never approximate one.** Every request field, every
response field, every value, every error message, exactly as the real system
produces them. Do not abbreviate a payload, elide a field, write `...`, invent a
plausible value, or mock a dependency. A scenario asserting an approximated
contract passes against a system that is wrong, and fails against one that is
right. Where you do not know the real shape, call the real thing and observe it.

**Shape every scenario as prepare, act, check.**

```gherkin
Scenario: <what behaviour, stated as an outcome>
  Given <the exact starting state, including how to reach it>
  When <the exact call, with every parameter and its value>
  Then <the exact expected result, field by field>
  And <the next assertion, one per line>
```

Put shared setup in a single `Background` so each scenario stays independently
executable — scenarios are read one at a time, and one that depends on a
previous scenario's leftovers cannot be run.

**Cover more than the happy path.** For each unit of behaviour: the normal case,
each boundary, each error, and the states that should be impossible. A suite of
happy paths tells you the system works when nothing goes wrong, which is not
where systems fail.

Write to `{{BDD_FILE_PATH}}`. Confirm the count and the split between happy path,
boundary and error cases in your report.
