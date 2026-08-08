---
kind: hook
name: format-after-edit
description: >-
  Lint a file immediately after it is edited, so style problems surface at the
  point of change rather than at review.
event: after-file-edit
blocking: false
env:
  optional: [LINT_FILE_COMMAND]
self_check:
  - Does this lint only the edited file, rather than the whole project?
  - Does it stay silent when no per-file lint command is configured?
  - Does it report rather than block, so an edit is never lost to a lint failure?
---

## Why this exists

A style violation found at review costs a round trip. Found immediately, it
costs nothing.

**It lints one file, not the project.** This fires after every edit, and a
whole-project lint on that cadence is slow enough that the hook gets disabled —
at which point it catches nothing. That is why it uses `{{LINT_FILE_COMMAND}}`
rather than the general lint command, and does nothing at all when that is
unset. A hook that is quiet is better than one that is in the way.

**It never blocks.** The edit is already on disk. Rejecting it here would hide
the result without undoing the change.

## Script

```sh
lint='{{LINT_FILE_COMMAND}}'

case "$lint" in
  ''|*'{{'*)
    # Not configured. Say nothing rather than guessing a command.
    decision=allow
    ;;
  *)
    if [ -n "$HOOK_FILE" ] && [ -f "$HOOK_FILE" ]; then
      output=$(cd "$PROJECT_DIR" && sh -c "$lint \"$HOOK_FILE\"" 2>&1 | head -20)
      if [ -n "$output" ]; then
        decision=allow
        message="Linter on $HOOK_FILE: $(printf '%s' "$output" | tr '\n' '; ')"
      fi
    fi
    ;;
esac
```
