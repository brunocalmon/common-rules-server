---
kind: hook
name: guard-destructive
description: >-
  Ask for confirmation before shell commands that discard work irreversibly.
event: before-shell
blocking: true
self_check:
  - Does this ask rather than deny, so deliberate use stays possible?
  - Are the patterns narrow enough that ordinary commands are unaffected?
---

## Why this exists

These commands are all legitimate and all unrecoverable. The asymmetry is what
matters: confirming one costs a moment, and running one by mistake costs work
that no longer exists anywhere.

It asks rather than denies. A hook that makes a legitimate operation impossible
gets disabled, and then it protects nothing at all.

## Script

```sh
cmd=$(printf '%s' "$HOOK_INPUT" | tr '\n' ' ')

case "$cmd" in
  *"rm -rf /"*|*"rm -fr /"*)
    decision=deny
    message="Blocked: this deletes from the filesystem root."
    ;;
  *"git push"*--force*|*"git push"*-f\ *)
    decision=ask
    message="Force push rewrites published history and can discard commits other people have. Confirm the branch and that nobody else is on it."
    ;;
  *"git reset --hard"*|*"git checkout ."*|*"git clean -fd"*)
    decision=ask
    message="This discards uncommitted work permanently. Confirm nothing in the working tree is worth keeping."
    ;;
  *"rm -rf"*|*"rm -fr"*)
    decision=ask
    message="Recursive delete. Confirm the path is what you intend before continuing."
    ;;
  *"DROP TABLE"*|*"DROP DATABASE"*|*"TRUNCATE "*)
    decision=ask
    message="Destructive schema change. Confirm the target is not a production database."
    ;;
esac
```
