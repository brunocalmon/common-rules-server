---
kind: workflow
name: bdd-cycle
description: >-
  Prove a system behaves as specified: write scenarios, execute them for real,
  assess coverage, close the gaps. Use for behavioural verification end to end.
phases:
  - name: Specify
    skills: [/grill-me]
    gate: The behaviour under test is agreed
  - name: Generate
    skills: [/bdd-generate]
    gate: Scenarios use exact contracts, with error and boundary cases
  - name: Execute
    skills: [/bdd-run]
  - name: Assess
    skills: [/bdd-review]
  - name: Close
    skills: [/dev-process, /bdd-generate]
    gate: Every failure is fixed or recorded as accepted
relationships:
  can-invoke:
    - target: /diagnose
      required: false
      note: When a scenario fails for a non-obvious reason
  output: templates/bdd-cycle.md
self_check:
  - Did the Generate gate confirm exact contracts before execution?
  - Is every failure either fixed or explicitly recorded as accepted with a reason?
  - Did the assessment measure against the system's real surface?
---

## Phases

| Phase | Skills | Gate |
|-------|--------|------|
| Specify | /grill-me | Behaviour under test agreed |
| Generate | /bdd-generate | Exact contracts, errors and boundaries covered |
| Execute | /bdd-run | — |
| Assess | /bdd-review | — |
| Close | /dev-process, /bdd-generate | Failures fixed or accepted |

## Instructions

The Generate gate is the load-bearing one. Scenarios written against an assumed
contract pass against a system that is wrong, so check before executing that
every payload is exact and that error and boundary cases exist alongside the
happy paths.

Execute runs scenarios one at a time via `get_bdd_scenario`. Assess judges the
suite against the system's real surface rather than against itself.

Close either fixes what failed or records it as accepted, with a reason. A
failure left in neither state will be rediscovered on the next run and
rationalised again.
