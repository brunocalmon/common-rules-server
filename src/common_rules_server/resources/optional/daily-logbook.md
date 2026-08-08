---
kind: skill
name: daily-logbook
description: >-
  Generate a daily summary from all notebook entries.
  Use to compile a high-level overview of daily progress.
trigger: user-invoked
relationships:
  comes-from:
    - target: /notebook
      required: false
  output: templates/daily-logbook.md
env:
  requires: [ENABLE_DAILY_LOGBOOK, ENABLE_NOTEBOOKS]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /notebook | no | Aggregates notebook entries |
| output | templates/daily-logbook.md | yes | Daily logbook summary |

## Instructions

If `ENABLE_DAILY_LOGBOOK` is false, stop and inform the user.
Read all notebook entries for the current day and compile them into a concise daily summary.
