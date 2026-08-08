[← Wiki Hub](../../README.md)

---

# ADR-006 — Export the kit into native editor files

**Status:** Accepted
**Date:** 2026-08-08

## Context

Reaching a resource through the MCP server costs a tool call and its response
every time it is used. Across a session that is a recurring cost for content that
does not change between calls.

It is also a dependency: with the server unavailable, misconfigured, or simply
not installed, none of the kit applies.

## Options considered

| Option | For | Against |
|---|---|---|
| Server only | One source of truth, always current | Per-use cost; the kit stops existing without the server |
| Native files only | Zero run-time cost | No resolution, no gating, no override logic |
| Both, with generated export | Native cost, server semantics | Generated files go stale until re-synced |

## Decision

Ship both. `sync_to_ide` exports the resolved catalogue into each editor's
documented layout — rules, skills, subagents, hooks — with placeholders already
substituted and gated resources already excluded.

The export is pure string transformation over parsed resources, with no model
involved, so re-running it is free. That is what makes staleness a cheap problem
rather than a reason to avoid the feature.

Generated files carry a header saying so, and are the only files `clean` will
remove. Managed blocks in `CLAUDE.md` and `AGENTS.md` are replaced in place, so
anything the user wrote around them survives.

## Consequences

Easier: the kit works with the server switched off, and costs nothing per use.
A project can commit the exported files and share the process with people who do
not run the server at all.

Harder: two representations can disagree. Mitigated by making regeneration free
and marking generated files clearly.

Workflows and loops are exported as skills, because no editor models them
separately and both are invocable procedures. Antigravity has no documented
subagent concept, so agents there become skills whose body states the persona.

## Revisit when

An editor gains a native concept for workflows, or the export needs information
that cannot be expressed in that editor's format.


---

← Previous: [ADR-005 Hooks Over Guidance](ADR-005-hooks-over-guidance.md) · Next: [Development Guide](../../engineering/DEVELOPMENT-GUIDE.md) →
