[← Wiki Hub](../../README.md)

---

# ADR-001 — One file format for every resource kind

**Status:** Accepted
**Date:** 2026-08-08

## Context

The server needs to serve five different things: rules, skills, agents,
workflows and loops. They differ in how they are invoked and what fields they
carry, but they share a name, a description, relationships and configuration
dependencies.

## Options considered

| Option | For | Against |
|---|---|---|
| A format per kind | Each shaped exactly to its needs | Five parsers, five validators, five ways to drift |
| One format, `kind` field | One parser, one validator, uniform discovery | Kind-specific fields must be conditionally validated |
| One format, no kinds | Simplest possible | Loses the distinction that makes routing possible |

## Decision

One Markdown-with-frontmatter format for every kind, with a required `kind`
field and conditional validation of kind-specific fields.

## Consequences

Easier: adding a kind, validating the whole catalogue, discovering resources
uniformly, letting a project override any resource by writing a file.

Harder: the parser carries a conditional branch per kind. This is contained —
one function, and the invalid combinations are enumerated in tests.

Expensive to reverse: every resource file and every project override would need
rewriting. The format is effectively a public interface.

## Revisit when

A kind appears whose fields cannot be expressed in frontmatter, or the
conditional validation grows past a handful of branches.


---

← Previous: [System Design](../SYSTEM-DESIGN.md) · Next: [ADR-002 Progressive Disclosure](ADR-002-progressive-disclosure.md) →
