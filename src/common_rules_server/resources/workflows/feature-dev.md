---
kind: workflow
name: feature-dev
description: >-
  Full feature development workflow.
  Use for new features that need planning, implementation, and review.
phases:
  - name: Discover
    skills: [/grill-me]
    gate: User confirms requirements are complete
  - name: Plan
    skills: [/architecture-compliance, /to-spec]
    gate: User approves spec
  - name: Develop
    skills: [/dev-process, /tdd]
  - name: Verify
    skills: [/verify, /test-cycle]
    gate: All checks pass
  - name: Review
    skills: [/review]
  - name: Document
    skills: [/docs]
relationships:
  output: templates/workflow-summary.md
---

## Relationships

| Phase | Skills | Gate |
|-------|--------|------|
| Discover | /grill-me | User confirms requirements |
| Plan | /architecture-compliance, /to-spec | User approves spec |
| Develop | /dev-process, /tdd | — |
| Verify | /verify, /test-cycle | All checks pass |
| Review | /review | — |
| Document | /docs | — |

## Instructions

Guide the user through a full feature development cycle. Each phase invokes
its skills in order. Gates require user confirmation before proceeding.

Phases can be skipped if the user explicitly requests it, but flag what was
skipped in the workflow summary.