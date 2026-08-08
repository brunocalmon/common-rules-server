---
kind: skill
name: diagnose
description: >-
  Find the root cause of a bug or regression through a reproducible feedback
  loop. Use when something is broken, failing intermittently, or slower than it
  should be.
trigger: model-invoked
relationships:
  goes-to:
    - target: /dev-process
      required: false
      note: Fix once the cause is actually known
  output: templates/diagnose.md
env:
  optional: [TEST_COMMAND]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| goes-to | /dev-process | no | Fix after diagnosis |
| output | templates/diagnose.md | yes | Diagnosis report |

## Instructions

Six phases. Skip one only with a stated reason.

**1. Build a feedback loop.** This is the phase that decides whether the rest
works, and it deserves disproportionate effort. You need one command that goes
red on this specific bug and green when it is gone. A failing test, a curl, a
CLI invocation, a replay of a captured trace, a throwaway harness, a bisection,
a differential run against a known-good version — whatever gives a fast,
unambiguous signal. Without it you are guessing and cannot tell when you have
stopped.

**2. Reproduce and minimise.** Run the loop and watch it fail. Confirm the
failure is the one the user reported and not a neighbour of it. Then cut the
scenario down until nothing further can be removed without the failure going
away. What remains is the bug.

**3. Hypothesise before testing.** Write three to five falsifiable hypotheses
and rank them. Show them to the user before you start testing: they often know
something that reorders the list instantly, which is far cheaper than
discovering it by elimination.

**4. Instrument.** Change one variable at a time. Prefer a debugger; failing
that, targeted logging at the specific point in question. Do not log everything
and grep — it buries the signal and outlasts the investigation. Tag temporary
output `[DEBUG-<id>]` so it can be found and removed exactly.

**5. Fix, and prove it.** Write the regression test first and watch it fail.
Apply the fix. Watch it pass. A fix without a test that failed beforehand is a
change that appeared to help.

**6. Clean up.** Remove every `[DEBUG-*]` marker. State the root cause plainly —
not the symptom, and not the fix. Someone reading this later needs to know why
it happened.
