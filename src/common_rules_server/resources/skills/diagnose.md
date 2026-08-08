---
kind: skill
name: diagnose
description: >-
  Structured diagnosis loop for hard bugs and performance regressions.
  Use when the user reports something broken, failing, or slow.
trigger: model-invoked
relationships:
  goes-to:
    - target: /dev-process
      required: false
      note: Fix the diagnosed bug
  output: templates/diagnose.md
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| goes-to | /dev-process | no | Fix after diagnosis |
| output | templates/diagnose.md | yes | Diagnosis report |

## Instructions

Six phases. Skip only when explicitly justified.

1. **Build a feedback loop.** This is THE skill. Find a tight pass/fail signal
   for the bug — one command that goes red on THIS bug. Spend disproportionate
   effort here. Try: failing test, curl, CLI invocation, headless browser,
   replay trace, throwaway harness, fuzz loop, bisection, differential loop.

2. **Reproduce + minimize.** Run the loop, watch it go red. Confirm it matches
   the user's symptom. Shrink to the smallest scenario that still fails.

3. **Hypothesize.** Generate 3-5 ranked, falsifiable hypotheses BEFORE testing
   any. Show the user — they often have domain knowledge that re-ranks instantly.

4. **Instrument.** One variable at a time. Prefer debugger > targeted logs >
   never "log everything and grep". Tag debug logs with `[DEBUG-xxxx]`.

5. **Fix + regression test.** Write the test before the fix. Watch it fail.
   Apply fix. Watch it pass.

6. **Cleanup.** Remove all `[DEBUG-*]` instrumentation. State the root cause
   in the commit message.