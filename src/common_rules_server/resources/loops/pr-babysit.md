---
kind: loop
name: pr-babysit
description: >-
  Keep a PR merge-ready by resolving comments, fixing CI, and
  handling merge conflicts in a loop.
trigger: user-invoked
schedule: "interval:5m"
wraps: /verify
relationships:
  can-invoke:
    - target: /verify
      required: true
    - target: /review
      required: false
  output: templates/pr-babysit.md
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| can-invoke | /verify | yes | Check CI status |
| can-invoke | /review | no | Triage comments |
| output | templates/pr-babysit.md | yes | Loop iteration report |

## Instructions

Check PR status, comments, and CI. Resolve issues until merge-ready.

1. **Merge conflicts.** Resolve intelligently. If intents conflict, ask.
2. **Comments.** Review unresolved comments. Address valid ones.
3. **CI.** Fix CI failures caused by this PR's changes. Never change CI
   config just to make it pass. Push fixes and re-check.

Loop until: green CI + no unresolved comments + no conflicts.