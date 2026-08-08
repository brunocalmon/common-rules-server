---
kind: hook
name: completion-gate
description: >-
  Remind the agent of its closing obligations when it finishes a turn without
  them — and stay silent when it did them.
event: stop
blocking: false
self_check:
  - Does this stay silent when the obligation was already met?
  - Does it observe the actual response, rather than assuming?
  - Can it re-trigger itself?
---

## Why this exists

The self-check and the session receipt are done last, which makes them the
things most likely to be dropped when a turn runs long. This fires exactly when
the agent believes it is finished, which is the only moment the reminder helps.

## What it must not do

Its first version set the message unconditionally. The editor delivers that as
context on every turn end, so the reminder arrived again after every reply —
eight turns in one session, each spending the user's quota re-answering a
checklist that had already been answered ([FND-029](../../../.docs/claude/tracking/findings/FND-029.md)).

The failure was not that it fired too often. It was that it could not tell the
difference between an agent that skipped the receipt and one that had written
three in a row. A reminder that cannot observe its own condition is a reminder
that can only nag.

So it reads the transcript and looks for the receipt it is about to ask for. If
the receipt is there, it says nothing. `HOOK_STOP_ACTIVE` covers the other
direction: if this hook already fired and continued the turn, it does not fire
again.

When the transcript is unavailable — an editor that does not supply one — it
stays silent. A reminder that cannot check is worse than no reminder, because
it fires on the turns that did nothing wrong.

## Script

```sh
# Already fired once this turn: do not re-trigger.
if [ "$HOOK_STOP_ACTIVE" = "true" ]; then
  decision=allow

# No transcript to inspect. Silence beats guessing.
elif [ -z "$HOOK_TRANSCRIPT" ] || [ ! -f "$HOOK_TRANSCRIPT" ]; then
  decision=allow

else
  # The receipt is a YAML block opening with schema_version. Look only at the
  # tail: earlier turns carry their own receipts, and finding one of those
  # would report this turn as complete when it is not.
  if tail -c 20000 "$HOOK_TRANSCRIPT" 2>/dev/null | grep -q 'schema_version'; then
    decision=allow
  else
    decision=allow
    message="This turn is ending without a session receipt. Answer the self_check questions of every resource you used, say plainly what you did not do, and close with the receipt."
  fi
fi
```
