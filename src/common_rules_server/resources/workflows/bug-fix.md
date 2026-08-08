---
kind: workflow
name: bug-fix
description: >-
  Fix a defect properly: reproduce it, find the cause, fix it, prove it stays
  fixed. Use when something is broken.
phases:
  - name: Reproduce
    skills: [/diagnose]
    gate: The bug reproduces on demand and the root cause is identified
  - name: Fix
    skills: [/dev-process]
  - name: Verify
    skills: [/verify]
    gate: The regression test fails before the fix and passes after
  - name: Review
    skills: [/review]
relationships:
  output: templates/workflow-summary.md
self_check:
  - Did the bug reproduce on demand before I changed anything?
  - Did the regression test fail before the fix and pass after?
  - Did I identify the root cause rather than the trigger?
---

## Phases

| Phase | Skills | Gate |
|-------|--------|------|
| Reproduce | /diagnose | Reproduces on demand, cause identified |
| Fix | /dev-process | — |
| Verify | /verify | Regression test fails before, passes after |
| Review | /review | — |

## Instructions

The first gate is the one that matters. A fix applied to a bug that was never
reproduced is a change that may coincide with the symptom disappearing, and
there is no way afterwards to tell the difference.

The Verify gate is equally specific: the regression test must have been observed
failing before the fix. A test written after the fix and passing immediately
proves only that it does not contradict the current code.
