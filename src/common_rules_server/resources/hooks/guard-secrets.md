---
kind: hook
name: guard-secrets
description: >-
  Block shell commands that would print credential files into the transcript,
  where they become part of the conversation and any log of it.
event: before-shell
blocking: true
self_check:
  - Does this block the read paths without blocking ordinary work on the same files?
---

## Why this exists

A secret printed into a transcript has left the machine. It is in the
conversation, in whatever logs the editor keeps, and in any context sent onward.
Deleting the file afterwards does not undo that.

The check is deliberately narrow: it blocks commands that *display* a
credential file, not commands that reference one. Editing `.env`, or a script
that reads it at runtime, is ordinary work and stays allowed.

## Script

```sh
cmd=$(printf '%s' "$HOOK_INPUT" | tr '\n' ' ')

case "$cmd" in
  *cat*.env*|*less*.env*|*more*.env*|*head*.env*|*tail*.env*|\
  *cat*id_rsa*|*cat*id_ed25519*|*cat*.pem*|*cat*.credentials*|\
  *cat*secrets*|*printenv*|*'env |'*)
    decision=deny
    message="Blocked: this command would print credentials into the transcript, where they cannot be recalled. Read the file with an editor tool, or reference the variable without displaying it."
    ;;
esac
```
