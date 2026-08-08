---
kind: skill
name: tdd
description: >-
  Drive implementation from failing tests, one behaviour at a time. Use when the
  project has a test suite and the change is behavioural.
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
| comes-from | /dev-process | no | Part of implementation |
| goes-to | /verify | yes | Full verification after the cycle |
| output | templates/tdd.md | yes | Cycle report |

## Instructions

Work in vertical slices: one behaviour, tested and implemented, before the next.

**The cycle.**

1. **Red.** Write one failing test for one behaviour. Run `{{TEST_COMMAND}}` and
   watch it fail. A test that has never failed has not been shown to test
   anything — it may be asserting something that was already true.
2. **Green.** Write the least code that passes. Run `{{TEST_COMMAND}}` again.
3. **Next.** Move to the following behaviour.

Refactoring belongs after the cycle, not inside it. Changing structure while a
behaviour is still being established makes it unclear which change broke what.

**What a good test looks like.** It exercises behaviour through the public
interface, so the implementation can be rewritten without rewriting the test. It
reads like a statement about what the system does. Its expected value comes from
an independent source — a worked example, a specification, a hand-computed
result — never from running the same logic the implementation uses.

**Failure modes worth naming.**

- *Implementation-coupled*: mocking internals or reaching for private methods.
  The test then fails on refactors and passes on real breakage.
- *Tautological*: the assertion recomputes the expected value the way the code
  does, so it passes whatever the code does.
- *Horizontal slicing*: every test first, then every implementation. This is not
  test-driven development; it is writing tests before finding out they were the
  wrong tests.

If `{{TEST_COMMAND}}` is unset, find the suite's entry point in the wiki or the
build files and confirm it with the user before running anything.
