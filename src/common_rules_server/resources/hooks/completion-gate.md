---
kind: hook
name: completion-gate
description: >-
  Remind the agent of its closing obligations when it tries to finish a turn.
event: stop
blocking: false
self_check:
  - Does this fire without creating a loop that prevents the turn ending?
---

## Why this exists

The self-check and the session receipt are both things the agent does last,
which makes them the things most likely to be dropped when a turn runs long.

This fires exactly when the agent believes it is finished, which is the only
moment the reminder is useful. It does not block: a gate that refuses to let a
turn end produces a loop, and a loop is worse than a missed checklist.

## Script

```sh
decision=allow
message="Before finishing: answer the self_check questions of every resource you used, and state honestly what you did not do. End your reply with the session receipt."
```
