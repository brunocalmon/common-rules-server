---
kind: skill
name: review
description: >-
  Review code changes for correctness, security, and quality.
  Use after verification passes.
trigger: model-invoked
relationships:
  comes-from:
    - target: /verify
      required: false
  can-invoke:
    - target: /review-security
      required: false
      note: If security-sensitive changes
  output: templates/review.md
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /verify | no | After verification |
| can-invoke | /review-security | no | Security-sensitive changes |
| output | templates/review.md | yes | Review report |

## Instructions

Review the diff (staged or branch changes) for:

1. **Correctness** — logic errors, edge cases, off-by-one, null handling.
2. **Security** — injection, auth bypass, data exposure. If concerning, invoke
   /review-security.
3. **Quality** — readability, naming, unnecessary complexity, dead code.
4. **Tests** — are changes covered? Are tests meaningful or tautological?

Report findings ranked by severity. For each finding, state: what's wrong,
why it matters, and how to fix it.