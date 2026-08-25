---
kind: hook
name: context-mode-stop
description: Finalizes context-mode processes on turn completion.
event: stop
raw_command: context-mode hook {ide} stop
matcher: ".*"
self_check:
  - Does this finalize cleanly without blocking the turn?
  - Can it re-trigger itself?
---
