[← Wiki Hub](../../README.md)

---

# ADR-005 — Enforce automations with editor hooks, not instructions

**Status:** Accepted
**Date:** 2026-08-08

## Context

The kit's rules and skills are guidance. An agent can skim them, deprioritise
them behind a long conversation, or ignore them, and nothing detects that. For
anything that must hold regardless — a secret never reaching the transcript, a
destructive command never running unconfirmed — guidance is not a mechanism.

All three supported editors provide lifecycle hooks. They also disagree on
everything about them: config location, event names, config nesting, and what a
handler prints to allow or deny.

## Options considered

| Option | For | Against |
|---|---|---|
| Instruct the agent in a rule | No machinery | Depends on the agent cooperating, which is the thing in question |
| Hand-write hooks per editor | Native to each | Three copies drifting apart; the same fix applied three times or once |
| One definition, generated per editor | Authored once, native everywhere | The translation layer must be maintained |
| Runtime adapter translating a common protocol | One script | Adds a dependency and a process to every event |

## Decision

A hook is a resource declaring a canonical event and a shell block. Each editor
gets a self-contained generated script: the same logic body inside a wrapper
that already knows that editor's output contract.

Translation happens at generation time, not run time. There is no adapter chain
and no dependency beyond POSIX `sh` — a hook that fails because `jq` is absent is
a hook that silently protects nothing.

Where an editor has no equivalent for an event, that is reported rather than
mapped onto something approximate. A hook wired to the wrong event is worse than
an absent one, because it looks installed.

## Consequences

Easier: an automation is written once and holds in every editor, including when
the agent ignores every rule in the kit.

Harder: the event mapping is a table this project must keep current as editors
change. It is small, documented, and covered by tests that execute the generated
scripts.

## Revisit when

A common hook standard emerges across editors, or an automation needs richer
input than a shell script can reasonably parse without a JSON tool.


---

← Previous: [ADR-004 Commit Authorship](ADR-004-commit-authorship.md) · Next: [ADR-006 Native Sync](ADR-006-native-sync.md) →
