---
kind: skill
name: daily-logbook
description: >-
  Summarise a day's notebook entries into a single readable record. Available
  when the daily logbook is enabled.
trigger: user-invoked
gate: ENABLE_DAILY_LOGBOOK
relationships:
  comes-from:
    - target: /notebook
      required: false
  output: templates/daily-logbook.md
env:
  optional: [NOTEBOOK_DIR]
self_check:
  - Did I summarise from what was written rather than adding conclusions?
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /notebook | no | Source entries |
| output | templates/daily-logbook.md | yes | Daily summary |

## Instructions

Read the day's entries in `{{NOTEBOOK_DIR}}` and produce one summary.

Lead with the decisions and what they commit the project to. Then what remains
open, and what was learned that changes how the next piece of work should be
approached.

Summarise from what is written. Do not add conclusions the entries do not
support — a summary that quietly editorialises becomes the record, and the
addition becomes indistinguishable from what actually happened.
