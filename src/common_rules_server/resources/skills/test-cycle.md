---
kind: skill
name: test-cycle
description: >-
  Examine test coverage and identify what is genuinely untested. Use when
  coverage is in question, not as a routine step.
trigger: user-invoked
relationships:
  comes-from:
    - target: /verify
      required: false
  output: templates/test-cycle.md
env:
  requires: [TEST_COMMAND]
  optional: [COVERAGE_COMMAND, COVERAGE_THRESHOLD]
self_check:
  - Did I say which behaviour is unverified, rather than only quoting a percentage?
  - Did I rank gaps by consequence rather than by line count?
  - Did I confirm before writing tests, instead of adding tests to move a number?
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /verify | no | Deeper look after verification |
| output | templates/test-cycle.md | yes | Coverage report |

## Instructions

1. Run `{{TEST_COMMAND}}`. If it fails, stop and report — coverage measured over
   a failing suite is not information.
2. Run `{{COVERAGE_COMMAND}}` when configured, and report the figure.
3. Compare against `{{COVERAGE_THRESHOLD}}` percent.

**Read the gaps, do not just count them.** A coverage percentage is a weak
signal: fully covered code can be untested in every way that matters, and an
uncovered branch may be unreachable. For each gap, say which behaviour is
unverified and what would break undetected if it regressed. That is the part
worth acting on.

Rank gaps by consequence, not by line count. Propose the tests worth writing and
confirm before writing them — tests added to move a number are maintenance
burden without benefit.
