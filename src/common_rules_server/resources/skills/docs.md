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
  optional: [README_PATH, WIKI_DIR, DOCS_PROTOCOL]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| can-invoke | /docs-workflow | no | For large doc efforts |
| output | templates/docs.md | yes | Documentation report |

## Instructions

Follow the {{DOCS_PROTOCOL}} strictly. The root {{README_PATH}} is exclusively a Hub/Redirect.
Do not put technical content, architecture, or long tutorials in the root README.
All actual documentation lives in {{WIKI_DIR}}.

**Review.** Check the Wiki Hub ({{README_PATH}}) and the Wiki ({{WIKI_DIR}}).
Flag anything outdated. Do not invent content — ask.

**Update.** After code change, check if it altered behavior, API, or architecture.
If so, update the relevant Wiki document.
**CRITICAL:** Never overwrite a decision silently.
1. Add a Document Impact footer to the new document.
2. Add an inline marker `[→ overrides RFC-XXX §Y]`.
3. Edit the old document to point to the new one with `[← overridden by RFC-YYY §Z]`.

**Create.** If docs are missing, help the user create them by asking targeted
questions. Do not generate from assumptions.