---
kind: skill
name: research
description: >-
  Investigate a question against primary sources and capture findings.
  Use when the user wants a topic researched or docs gathered.
trigger: model-invoked
relationships:
  goes-to:
    - target: /grill-me
      required: false
      note: Research findings feed into grilling
  output: templates/research.md
env:
  optional: [DOCS_DIR]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| goes-to | /grill-me | no | Research feeds grilling |
| output | templates/research.md | yes | Research report |

## Instructions

Spin up a background agent to do the research.

The agent's job:
1. Investigate against **primary sources** — official docs, source code, specs.
   Follow every claim back to the source that owns it.
2. Write findings to a Markdown file, citing each claim's source.
3. Save where the repo keeps such notes. If no convention exists, use
   {{DOCS_DIR}}/research/.