---
kind: hook
name: code-review-graph-update
description: Incrementally updates the code review graph when files are edited.
event: after-file-edit
raw_command: code-review-graph update --brief
self_check:
  - Does this run only on file edits, not on every tool call?
  - Does it stay silent on success rather than injecting context?
---
