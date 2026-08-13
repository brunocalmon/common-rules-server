---
kind: hook
name: code-review-graph-update
description: Incrementally updates the code review graph when files are edited and returns impact summary.
event: after-file-edit
script: |
  # Run a brief update and return the output as additional context
  code-review-graph update --brief
---
