---
kind: skill
name: test-cycle
description: >-
  Run tests, analyze coverage, identify gaps.
  Use when coverage analysis is needed.
trigger: user-invoked
relationships:
  comes-from:
    - target: /verify
      required: false
  output: templates/test-cycle.md
env:
  requires: [TEST_COMMAND]
  optional: [COVERAGE_COMMAND, COVERAGE_THRESHOLD]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /verify | no | Deeper analysis after verification |
| output | templates/test-cycle.md | yes | Coverage report |

## Instructions

1. Run {{TEST_COMMAND}}. If it fails, report errors and stop.
2. If {{COVERAGE_COMMAND}} is set, run it and report coverage.
3. If coverage is below {{COVERAGE_THRESHOLD}} (default: 80%), identify gaps.
4. For each gap, suggest a test. Do not write tests automatically — confirm first.

If commands are not set, read from {{README_PATH}} or ask.