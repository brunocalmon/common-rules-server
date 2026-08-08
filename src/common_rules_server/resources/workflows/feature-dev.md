---
kind: workflow
name: feature-dev
description: >-
  Build a feature end to end: settle requirements, plan, implement, verify,
  review, document. Use for new work of any real size.
phases:
  - name: Discover
    skills: [/grill-me]
    gate: The user confirms the requirements are settled
  - name: Plan
    skills: [/architecture-compliance, /to-spec]
    gate: The user approves the specification
  - name: Build
    skills: [/dev-process, /tdd]
  - name: Verify
    skills: [/verify, /test-cycle]
    gate: The build is green and tests pass
  - name: Review
    skills: [/review]
  - name: Document
    skills: [/docs]
relationships:
  can-invoke:
    - target: /research
      required: false
      note: When discovery needs facts nobody has
  output: templates/workflow-summary.md
self_check:
  - Did I stop at each gate and get a real answer?
  - Were requirements confirmed settled before the Build phase started?
  - Did I record which phases were skipped and why?
---

## Phases

| Phase | Skills | Gate |
|-------|--------|------|
| Discover | /grill-me | Requirements confirmed settled |
| Plan | /architecture-compliance, /to-spec | Specification approved |
| Build | /dev-process, /tdd | — |
| Verify | /verify, /test-cycle | Build green, tests pass |
| Review | /review | — |
| Document | /docs | — |

## Instructions

Run the phases in order. A gate means stop and get an answer — not pause,
announce, and continue.

The two early gates carry most of the value. Requirements confirmed at Discover
and a specification approved at Plan are what stop the Build phase from
producing something correct that nobody wanted.

Phases may be skipped when the user asks. Record which were skipped and why in
the summary, so the next person can tell the difference between work that passed
review and work that never went to review.
