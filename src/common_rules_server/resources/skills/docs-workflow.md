---
kind: skill
name: docs-workflow
description: >-
  Structured documentation generation for large efforts.
  Use for new docs, major rewrites. For small updates, use /docs.
trigger: user-invoked
relationships:
  comes-from:
    - target: /docs
      required: false
  output: templates/docs-workflow.md
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /docs | no | Escalated from /docs |
| output | templates/docs-workflow.md | yes | Docs workflow report |

## Instructions

1. **Requirements.** State what docs are needed and why. List open questions.
2. **Stakeholder input.** Present questions to user. Wait for answers.
3. **Strategy.** Propose 2-3 approaches with pros/cons. Recommend one. Wait.
4. **Plan.** Create checklist. Validate with user.
5. **Execute.** Write documentation following approved plan.