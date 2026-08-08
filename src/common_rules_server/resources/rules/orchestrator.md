---
kind: rule
name: orchestrator
description: >-
  Default development workflow — a lightweight guide, not a rigid pipeline.
  Suggests which skills to invoke based on the task shape.
type: Always
relationships:
  comes-from:
    - target: /general
      required: true
  can-invoke:
    - target: /grill-me
      required: false
      note: Stress-test requirements before starting
    - target: /dev-process
      required: false
    - target: /verify
      required: false
    - target: /review
      required: false
  output: templates/orchestrator.md
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /general | yes | Health check runs first |
| can-invoke | /grill-me | no | Stress-test requirements |
| can-invoke | /dev-process | no | Development workflow |
| can-invoke | /verify | no | Build/test/lint verification |
| can-invoke | /review | no | Code review |
| output | templates/orchestrator.md | yes | Workflow summary |

## Instructions

After /general completes, suggest the appropriate workflow based on task shape.

| Task shape | Suggested flow | Key skills |
|-----------|---------------|------------|
| New feature | Plan → Grill → Develop → Test → Verify → Review | /grill-me, /dev-process, /tdd, /verify, /review |
| Bug fix | Diagnose → Fix → Test → Verify | /diagnose, /dev-process, /verify |
| Docs change | Assess → Write → Review | /docs, /review |
| Refactor | Plan → Develop → Verify → Review | /architecture-compliance, /dev-process, /verify, /review |
| Exploration | Research → Grill → Spec | /research, /grill-me, /to-spec |

Self-check before proceeding:
- Were requirements gathered? If not and the task is non-trivial, suggest /grill-me.
- Is architecture documented? If not, suggest /docs first.
- Does the user want this flow or a different one? Ask if unsure.

The orchestrator does not enforce order. It provides structure. Use judgment.