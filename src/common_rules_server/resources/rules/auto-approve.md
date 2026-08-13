---
kind: rule
name: auto-approve
description: >-
  Policy for handling automatic IDE approvals on plans with open questions.
  Prevents blind assumptions when questions are unanswered.
type: Always
self_check:
  - Did I stop to ask questions if the plan was auto-approved with unanswered open questions?
---

## Auto-Approval of Open Questions

When you present an **Implementation Plan** containing **Open Questions** to the user, and the IDE automatically approves it without the user providing the answers, **DO NOT MAKE ASSUMPTIONS**.

You must immediately halt execution and invoke `/grill-me` (or ask the user directly in real-time) to settle the open questions. This ensures that auto-approvals remain reliable and dynamic, preventing the agent from guessing critical design decisions.
