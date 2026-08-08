---
kind: rule
name: session-receipt
description: >-
  Close every response with a structured receipt stating what was asked, what
  was used, what was changed, and how it was verified.
type: Always
relationships:
  output: templates/session-receipt.md
env:
  optional: [PROJECT_NAME]
self_check:
  - Does the receipt describe what I actually did, not what I set out to do?
  - Does verification name evidence I observed, rather than an intention?
  - Are the files listed the files I really wrote?
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| output | templates/session-receipt.md | yes | Receipt format |

## Instructions

End every response with this block, filled in from what actually happened:

```yaml
schema_version: 1
request:
  user_text_summary: "<one sentence: what the user asked for>"
resources_used: ["<kind:name>", "..."]
tools_used: ["<tool@server>", "..."]
files:
  written: ["<path>", "..."]
self_check: passed | partial
verification: "<what you observed that shows this works>"
outstanding: "<what is not done, or 'nothing'>"
```

Drop `files` when nothing was written. Drop `outstanding` only when genuinely
nothing is outstanding — not when you would prefer there to be nothing.

**The verification field is the one that matters.** It states what you observed:
a command that ran and what it printed, a test that passed, a value you read
back. "Implemented the change" is not verification, it is a restatement of the
work. If you did not verify, write that you did not.

**The receipt is written from evidence, not from memory of intent.** Before
filling it in, look at what you actually ran and actually changed. A receipt
composed from what you meant to do is worse than no receipt, because it reads as
a record.

If the receipt shows you departed from the process — resources you should have
used and did not, verification you skipped — correct the work before sending the
response rather than shipping the receipt as a confession.
