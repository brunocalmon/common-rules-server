---
kind: skill
name: architecture-compliance
description: >-
  Validate that implementation matches documented architecture.
  Use before major changes or as part of planning.
trigger: model-invoked
relationships:
  comes-from:
    - target: /orchestrator
      required: false
  output: templates/architecture-compliance.md
env:
  optional: [WIKI_DIR]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /orchestrator | no | Part of planning phase |
| output | templates/architecture-compliance.md | yes | Compliance report |

## Instructions

Read architecture documents in {{WIKI_DIR}}/architecture and compare against the actual codebase.

| Dimension | What to compare |
|-----------|----------------|
| Project structure | Documented layout vs actual `find` output |
| Patterns | Documented patterns vs actual organization |
| Module responsibilities | Documented boundaries vs actual dependencies |
| Build config | Documented build system vs actual files |

For each: if compliant, note it. If not, describe the gap and recommend fixing
the code OR updating the docs.

If architecture docs do not exist in {{WIKI_DIR}}, stop and ask the user to create them.