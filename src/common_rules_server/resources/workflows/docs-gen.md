---
kind: workflow
name: docs-gen
description: >-
  Produce a substantial body of documentation with approval at each stage. Use
  for new documentation sets or major rewrites.
phases:
  - name: Assess
    skills: [/docs]
    gate: The gaps are identified and agreed
  - name: Strategy
    skills: [/docs-workflow]
    gate: The user approves the approach
  - name: Write
    skills: [/docs-workflow]
  - name: Review
    skills: [/review, /architecture-compliance]
relationships:
  output: templates/workflow-summary.md
---

## Phases

| Phase | Skills | Gate |
|-------|--------|------|
| Assess | /docs | Gaps identified and agreed |
| Strategy | /docs-workflow | Approach approved |
| Write | /docs-workflow | — |
| Review | /review, /architecture-compliance | — |

## Instructions

Documentation efforts fail by generating volume nobody asked for, so both gates
come before any writing.

The Review phase checks the documentation against the code, not against itself.
Documentation that is internally consistent and describes a system that no
longer exists is the outcome this phase is here to catch.
