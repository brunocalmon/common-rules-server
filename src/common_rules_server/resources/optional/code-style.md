---
kind: skill
name: code-style
description: >-
  Validate code against the project's configured linter. Available when a linter
  is configured.
trigger: model-invoked
gate: LINTER_TOOL
relationships:
  comes-from:
    - target: /verify
      required: false
  output: templates/code-style.md
env:
  requires: [LINTER_TOOL]
  optional: [LINT_COMMAND, LINTER_CONFIG]
self_check:
  - Did I fix violations rather than widening a suppression list?
  - If the linter examined nothing, did I say so instead of reporting a clean run?
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /verify | no | Part of verification |
| output | templates/code-style.md | yes | Style report |

## Instructions

Run `{{LINT_COMMAND}}` using `{{LINTER_TOOL}}` with the configuration at
`{{LINTER_CONFIG}}`. Report violations grouped by rule, with counts and file
locations.

**Fix violations; do not silence them.** Widening a suppression list or relaxing
the configuration to make a run clean removes the signal for every future change
as well as this one. Where a rule is genuinely wrong for this project, say so
and let the user change it deliberately.

When the linter is not configured for the files in question, say that rather
than reporting a clean run — an empty result from a tool that examined nothing
reads identically to a pass.
