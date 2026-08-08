---
kind: skill
name: tdd
description: >-
  Red-green-refactor loop for test-driven development.
  Use when the project has tests and the user wants TDD discipline.
trigger: model-invoked
relationships:
  comes-from:
    - target: /dev-process
      required: false
  goes-to:
    - target: /verify
      required: true
  output: templates/tdd.md
env:
  requires: [TEST_COMMAND]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /dev-process | no | Part of dev workflow |
| goes-to | /verify | yes | Verify after TDD cycle |
| output | templates/tdd.md | yes | TDD cycle report |

## Instructions

Work in vertical slices: one test, one implementation, repeat.

**The loop:**
1. **Red.** Write a failing test. Run {{TEST_COMMAND}} to confirm it fails.
2. **Green.** Write minimum code to pass. Run {{TEST_COMMAND}} to confirm.
3. **Repeat.** Next behavior. Do not refactor inside the loop.

Refactoring belongs to the review stage, not the red-green cycle.

**What makes a good test:**
- Tests verify behavior through public interfaces, not implementation details.
- A good test reads like a specification.
- Expected values come from an independent source of truth — never recomputed
  the way the code does.

**Anti-patterns:**
- Implementation-coupled: mocking internals, testing private methods.
- Tautological: assertion recomputes expected value same way code does.
- Horizontal slicing: all tests first, then all implementation.

If {{TEST_COMMAND}} is not set, detect from project files and ask user.