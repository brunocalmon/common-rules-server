---
kind: workflow
name: bug-fix
description: >-
  Bug fix workflow. Diagnose, fix, verify.
phases:
  - name: Diagnose
    skills: [/diagnose]
    gate: Root cause identified
  - name: Fix
    skills: [/dev-process]
  - name: Verify
    skills: [/verify]
  - name: Review
    skills: [/review]
relationships:
  output: templates/workflow-summary.md
---

## Relationships

| Phase | Skills | Gate |
|-------|--------|------|
| Diagnose | /diagnose | Root cause identified |
| Fix | /dev-process | — |
| Verify | /verify | All checks pass |
| Review | /review | — |