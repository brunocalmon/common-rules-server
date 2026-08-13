---
kind: hook
name: context-mode-posttooluse
description: Captures responses from executed tools for context-mode.
event: after-file-edit
raw_command: context-mode hook {ide} posttooluse
matcher: ".*"
self_check:
  - Does this capture all tool responses without filtering?
  - Does it pass through to context-mode without altering the tool output?
---
