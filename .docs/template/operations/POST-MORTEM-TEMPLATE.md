[← Wiki Hub](../README.md)

---

# Post-Mortem — <incident>

**Date:** <YYYY-MM-DD>
**Duration:** <start> to <end>
**Impact:** <who was affected and how>
**Severity:** <level>

This document is blameless. It examines how the system allowed the failure, not
who performed the action. A post-mortem that assigns fault produces people who
hide incidents, which is strictly worse than the incident.

## Summary

What happened, in a short paragraph a reader outside the team can follow.

## Timeline

| Time | Event | Who noticed | How |
|---|---|---|---|

## Root cause

The condition that made this possible — not the trigger. The trigger is what
happened that day; the root cause is why that was enough to break things.

## Contributing factors

What made it worse, slower to detect, or harder to resolve.

## What went well

Genuinely. Detection, tooling, communication. These are the things to protect.

## Actions

| # | Action | Type | Owner | Ticket |
|---|---|---|---|---|
| 1 | <action> | Prevent / Detect / Mitigate | <name> | <link> |

Prefer actions that make the class of failure impossible over actions that make
this instance unlikely. "Be more careful" is not an action.


---

← Previous: [Operational Playbook](PLAYBOOK-TEMPLATE.md) · Next: [Setup Guide](../onboarding/SETUP-GUIDE-TEMPLATE.md) →
