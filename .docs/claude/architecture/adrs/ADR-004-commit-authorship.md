[← Wiki Hub](../../README.md)

---

# ADR-004 — Protect commit authorship with a git hook

**Status:** Accepted
**Date:** 2026-08-08

## Context

Coding agents append `Co-authored-by:` trailers and "generated with" footers to
commit messages. On GitHub a co-author trailer attributes the commit to that
identity. This happens without being asked, and the repository owner is the one
paying for the tool.

## Options considered

| Option | For | Against |
|---|---|---|
| Instruct the agent not to | No machinery | Depends on every agent complying, including ones that never mention it |
| Editor-specific settings | Native | Different in every editor, and not all expose it |
| A `commit-msg` git hook | Applies to every commit from every tool | Needs installing per repository |

## Decision

Install a `commit-msg` hook, on by default, that removes trailers naming a known
AI identity.

**Human co-author trailers are preserved.** A human trailer is a true statement
about who wrote the code; removing it would be a worse version of the problem.
The filter therefore errs towards leaving a trailer in place, and every identity
is matched on token boundaries — see
[FND-012](../../tracking/findings/FND-012.md) for what happens otherwise.

## Consequences

Easier: authorship is correct regardless of which agent commits.

Harder: a repository-local hook is not version controlled and needs reinstalling
on a fresh clone. `setup_config` is idempotent, so re-running it is the fix.

An existing hook is preserved and chained rather than replaced, since it may be
the project's own commit-message linter.

## Revisit when

Agents stop adding these trailers, or a git feature makes it configurable
upstream.


---

← Previous: [ADR-003 Report Before Writing](ADR-003-report-not-write.md) · Next: [ADR-005 Hooks Over Guidance](ADR-005-hooks-over-guidance.md) →
