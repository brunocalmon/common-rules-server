---
kind: loop
name: pr-babysit
description: >-
  Keep a change merge-ready: resolve conflicts, address review comments, fix the
  build, repeat until it is genuinely ready.
trigger: user-invoked
schedule: on-demand
wraps: /verify
relationships:
  can-invoke:
    - target: /verify
      required: true
    - target: /review
      required: false
    - target: /dev-process
      required: false
    - target: /diagnose
      required: false
      note: When a build failure is not self-explanatory
  output: templates/pr-babysit.md
self_check:
  - Did I leave the build configuration alone rather than weakening a check to go green?
  - Did I stop and ask where two changes genuinely disagreed?
  - Did I reply with reasoning where I disagreed with a comment, rather than complying or ignoring?
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| can-invoke | /verify | yes | Confirm the build each round |
| can-invoke | /review | no | Triage incoming comments |
| can-invoke | /dev-process | no | Make the changes |
| can-invoke | /diagnose | no | Non-obvious build failures |
| output | templates/pr-babysit.md | yes | Round report |

## Instructions

Each round, in this order:

1. **Conflicts.** Resolve them where the intent of both sides is clear. Where
   two changes genuinely disagree about what the code should do, stop and ask —
   a conflict resolved by picking a side silently discards someone's work.
2. **Comments.** Read the unresolved ones. Address what is valid. Where you
   disagree, reply with the reasoning rather than complying or ignoring.
3. **Build.** Invoke /verify. Fix failures caused by this change.

**Never edit the build configuration to make a failing build pass.** If the
build is failing because a check is inconvenient, the check is doing its job.
Weakening it converts a visible problem into an invisible one, and does so
across every future change rather than just this one.

Stop when the build is green, no comments are unresolved, and no conflicts
remain. Report each round: what changed, what is left, and anything that needs a
decision you should not make alone.
