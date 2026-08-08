[← Wiki Hub](../README.md)

---

# PRD — Common Rules Server

**Status:** Shipped
**Last reviewed:** 2026-08-08

## Problem

A developer working with coding agents across several editors has the same
process in their head every time and no way to give it to the agent. Each editor
stores rules differently, so guidance written for one is unusable in another, and
it drifts out of date independently in each place.

An earlier attempt at this repository encoded the process as pseudo-code —
variables, conditionals, return values — to remove ambiguity. It did the
opposite. Files reached 150 to 250 lines each, agents interpreted the control
flow inconsistently, and the cost of changing a rule became high enough that
rules stopped being changed.

## Evidence

Thirteen rule files averaging around 170 lines, all pseudo-code, unchanged since
first commit despite the workflow around them moving on.

## Who it affects

| Audience | Their situation | What they need |
|---|---|---|
| Developer using agents | Same process retyped per editor, drifting | One source of process, wherever they work |
| Agent | Guidance either absent or written as code it must interpret | Direct instructions, and a way to find the right one |
| Someone joining a project | Conventions live in someone's head | Conventions the agent already applies |

## Requirements

| # | Requirement | Priority | Rationale |
|---|---|---|---|
| R1 | Resources written in natural language | Must | Pseudo-code was the original failure |
| R2 | One format across every resource kind | Must | Five formats means five parsers and five ways to be wrong |
| R3 | Resources declare their own relationships | Must | The process lives in the edges, not the files |
| R4 | Nothing environment-specific hardcoded | Must | The kit has to work in projects it has never seen |
| R5 | Full map in one call, bodies on demand | Must | Sending everything wastes the context it is meant to inform |
| R6 | Projects extend without forking | Must | A kit that cannot be specialised gets abandoned |
| R7 | Names no editor | Must | The same guidance has to be correct everywhere |
| R8 | Configures the project actively | Should | A server that only answers questions leaves the setup undone |
| R9 | Commit authorship stays with the owner | Should | Agents claim co-authorship without asking |
| R10 | Behaviour verifiable by an agent end to end | Should | Unit tests did not catch the defects that mattered |

## Success

| Measure | Before | After |
|---|---|---|
| Average resource length | ~170 lines | ~45 lines |
| Resource kinds supported | 1 | 5 |
| Placeholders that resolve | 0 | all |
| Tests | 11 | 457 |
| Editors supported | 1 by convention | 5 by detection |

## Out of scope

Running or scheduling agents; hosting; anything requiring network access at
runtime; replacing the editor's own agent.

## Open questions

| # | Question | Tracked as |
|---|---|---|
| 1 | How should companion servers be installed? | [FND-013](../tracking/findings/FND-013.md) |


---

← Previous: [Documentation Protocol](../DOCUMENTATION-PROTOCOL.md) · Next: [System Design](../architecture/SYSTEM-DESIGN.md) →
