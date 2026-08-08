---
kind: workflow
name: bdd-cycle
description: >-
  Full BDD lifecycle: generate scenarios, execute them, review results,
  fix failures, and re-run for regression.
phases:
  - name: Generate
    skills: [/bdd-generate]
    gate: Feature file created and reviewed
  - name: Run
    skills: [/bdd-run]
    gate: All scenarios executed
  - name: Review
    skills: [/bdd-review]
    gate: Coverage gaps identified
  - name: Fix
    skills: [/dev-process]
    gate: Failures resolved
  - name: Regression
    skills: [/bdd-run]
    gate: All scenarios pass
relationships:
  output: templates/bdd-cycle.md
---
