[← Wiki Hub](../../README.md)

---

# ADR-002 — Split discovery from retrieval

**Status:** Accepted
**Date:** 2026-08-08

## Context

An agent needs to know what is available before it can choose. The full kit is
roughly 1,400 lines of instructions. Sending all of it so the agent can pick one
resource would consume a large share of the context window to describe work
rather than do it.

## Options considered

| Option | For | Against |
|---|---|---|
| One call returning everything | Single round trip | Spends context describing options it will not use |
| Discovery then retrieval | Sends only what is needed | Two round trips |
| Discovery with truncated bodies | One call, some content | Truncated instructions are worse than none |

## Decision

`get_context` returns names, descriptions, relationships and configuration
status for everything, and no bodies. `get_resource` returns one full resource.

This makes the description load-bearing: it is the only thing an agent sees when
choosing. A kit-wide test enforces a minimum length on it for that reason.

## Consequences

Easier: the map stays cheap as the kit grows; a project can ship many resources
without penalty.

Harder: an agent that needs three resources makes three calls. Acceptable — it
only fetches what it decided to use.

## Revisit when

Round-trip latency dominates, or descriptions stop being sufficient to choose on.


---

← Previous: [ADR-001 Unified Resource Model](ADR-001-unified-resource-model.md) · Next: [ADR-003 Report Before Writing](ADR-003-report-not-write.md) →
