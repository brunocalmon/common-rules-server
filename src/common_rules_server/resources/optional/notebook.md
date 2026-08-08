---
kind: skill
name: notebook
description: >-
  Track decisions and progress in dated notebook files.
  Use when the user wants to maintain a running log of work.
trigger: user-invoked
relationships:
  output: templates/notebook.md
env:
  requires: [ENABLE_NOTEBOOKS]
  optional: [NOTEBOOK_DIR]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| output | templates/notebook.md | yes | Notebook entry |

## Instructions

If `ENABLE_NOTEBOOKS` is false, stop and inform the user.
Write a dated entry to `{{NOTEBOOK_DIR}}` summarizing the work done, decisions made, and next steps.
