---
kind: skill
name: code-style
description: >-
  Enforce code style rules using the project's linter.
  Use to ensure code formatting consistency.
trigger: model-invoked
relationships:
  output: templates/code-style.md
env:
  requires: [LINTER_TOOL]
  optional: [LINTER_CONFIG, LINT_COMMAND]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| output | templates/code-style.md | yes | Code style report |

## Instructions

If `LINTER_TOOL` is set, run the `{{LINT_COMMAND}}` taking into account the `{{LINTER_CONFIG}}` if provided. Report any formatting or style violations.
