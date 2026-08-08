---
kind: workflow
name: docs-gen
description: >-
  Documentation generation workflow for large doc efforts.
phases:
  - name: Assess
    skills: [/docs]
    gate: Gaps identified
  - name: Plan
    skills: [/docs-workflow]
    gate: User approves strategy
  - name: Execute
    skills: [/docs-workflow]
  - name: Review
    skills: [/review]
relationships:
  output: templates/workflow-summary.md
---