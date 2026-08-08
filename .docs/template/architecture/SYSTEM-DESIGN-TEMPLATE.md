[← Wiki Hub](../README.md)

---

# System Design — <system name>

**Status:** Current | Superseded
**Last reviewed:** <YYYY-MM-DD>

## Purpose

What this system does, in a few sentences, for a reader who has never seen it.

## Context

What sits around it: who calls it, what it calls, what it stores.

```
<diagram or ASCII sketch>
```

## Components

| Component | Responsibility | Owns | Depends on |
|---|---|---|---|
| <name> | <single responsibility> | <data or behaviour> | <other components> |

A component with more than one responsibility in this table is a component that
should probably be two.

## Data

| Store | Contents | Lifetime | Consistency |
|---|---|---|---|

## Key flows

Walk the important paths end to end. One heading per flow, numbered steps.

## Constraints

Anything that limits the design and is not negotiable: compliance, latency
budgets, existing systems that cannot change, team size.

## Known weaknesses

Where this design is understood to be inadequate, and what would trigger
revisiting it. Every design has these; recording them stops the next person
rediscovering them by accident.

## Decisions

Individual decisions are recorded as ADRs, not here.
See [ADR template](adrs/ADR-TEMPLATE.md).


---

← Previous: [User Journey](../product/USER-JOURNEY-TEMPLATE.md) · Next: [Architecture Decision Record](adrs/ADR-TEMPLATE.md) →
