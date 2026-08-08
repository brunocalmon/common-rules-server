---
kind: skill
name: docs
description: >-
  Review, create, or update project documentation.
  Use after code changes that alter behavior, or when docs are missing.
trigger: model-invoked
relationships:
  can-invoke:
    - target: /docs-workflow
      required: false
      note: For large documentation efforts
  output: templates/docs.md
env:
  optional: [README_PATH, ARCHITECTURE_PATH, DOCS_DIR]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| can-invoke | /docs-workflow | no | For large doc efforts |
| output | templates/docs.md | yes | Documentation report |

## Instructions

**Review.** Check {{README_PATH}} and {{ARCHITECTURE_PATH}} exist and are accurate.
- {{README_PATH}}: project overview, setup, usage, dev workflow.
- {{ARCHITECTURE_PATH}}: structure, patterns, modules, build system.
Flag anything outdated. Do not invent content — ask.

**Update.** After code change, check if it altered:
- Public API or behavior → update {{README_PATH}}.
- Architecture or module boundaries → update {{ARCHITECTURE_PATH}}.
- Neither → no doc update needed.

**Create.** If docs are missing, help the user create them by asking targeted
questions. Do not generate from assumptions.