---
kind: skill
name: verify
description: >-
  Build, test, and lint the project. Confirm nothing is broken.
  Use after any code change.
trigger: model-invoked
relationships:
  comes-from:
    - target: /dev-process
      required: false
    - target: /tdd
      required: false
  goes-to:
    - target: /review
      required: false
  output: templates/verify.md
env:
  optional: [BUILD_COMMAND, TEST_COMMAND, LINT_COMMAND]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /dev-process | no | After development |
| comes-from | /tdd | no | After TDD cycle |
| goes-to | /review | no | Review after verification |
| output | templates/verify.md | yes | Verification report |

## Instructions

Run these checks in order. Stop on first failure.

1. **Build.** Run {{BUILD_COMMAND}}. If not set, detect or ask.
2. **Test.** Run {{TEST_COMMAND}}. Report pass/fail count.
3. **Lint.** If {{LINT_COMMAND}} is set, run it. Report violations.

If all pass, report success. If any fail, report errors and suggest fixes.