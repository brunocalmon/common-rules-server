[← Wiki Hub](../../README.md)

---

# ADR-003 — Report on shared configuration rather than writing to it

**Status:** Accepted
**Date:** 2026-08-08

## Context

The kit's resources assume two companion MCP servers. The server can detect
whether they are configured. The question is what it should do when they are not.

The previous implementation wrote entries automatically, using assumed package
names, into whichever MCP configuration file it found — including the editor-wide
one. See [FND-006](../../tracking/findings/FND-006.md).

## Options considered

| Option | For | Against |
|---|---|---|
| Write automatically | Nothing left for the user to do | Editor-wide config is shared by every project; a wrong entry breaks all of them |
| Report only | Cannot break anything | User has to act |
| Report by default, write on consent | Safe default, still automatable | Two paths to maintain |

## Decision

Report by default. Writing requires explicit consent, is limited to entries
constructible from evidence, backs the file up first, and never overwrites an
existing entry.

The asymmetry drives this: failing to add a server costs the user one manual
edit. Adding a wrong one breaks their tooling in every project until they find
it, and they have no reason to suspect this server did it.

## Consequences

Easier: setup cannot damage the user's environment.

Harder: companions are not configured automatically. Mitigated by reporting what
each is for and why it matters.

## Revisit when

A reliable way to determine the correct launch command exists — see
[FND-013](../../tracking/findings/FND-013.md).


---

← Previous: [ADR-002 Progressive Disclosure](ADR-002-progressive-disclosure.md) · Next: [ADR-004 Commit Authorship](ADR-004-commit-authorship.md) →
