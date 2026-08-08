---
kind: hook
name: format-after-edit
description: >-
  Run the project's configured linter after a file is edited, so style problems
  surface immediately rather than at review.
event: after-file-edit
blocking: false
env:
  optional: [LINT_COMMAND]
self_check:
  - Does this stay silent when no linter is configured?
  - Does it report rather than block, so an edit is never lost to a lint failure?
---

## Why this exists

A style violation found at review costs a round trip. Found immediately, it
costs nothing.

This never blocks. An edit that has already been written should not be rejected
because a linter dislikes it — the change is on disk either way, and blocking
here would only hide the result.

## Script

```sh
lint='{{LINT_COMMAND}}'

case "$lint" in
  ''|*'{{'*)
    decision=allow
    ;;
  *)
    output=$(cd "$PROJECT_DIR" && sh -c "$lint" 2>&1 | tail -20)
    if [ -n "$output" ]; then
      decision=allow
      message="Linter reported: $(printf '%s' "$output" | tr '\n' '; ')"
    fi
    ;;
esac
```
