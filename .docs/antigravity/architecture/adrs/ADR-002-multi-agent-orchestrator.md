[← Wiki Hub](../../README.md)

---

# ADR-002 — Multi-agent orchestrator architecture

**Status:** Accepted
**Date:** 2026-08-08

## Context

The current orchestration model is a rule (`rules/orchestrator`) that routes the
single IDE agent to the right skills and workflows. This works for sequential
work but cannot parallelise: one agent, one context window, one task at a time.

All three supported editors now offer subagent spawning with parallel execution:

| Editor | Mechanism | Concurrency | Depth limit |
|---|---|---|---|
| Claude Code | Agent tool (v2.1) | 20 concurrent, 200 session | 3 levels |
| Cursor | /multitask (v3.2) | 8 parallel in worktrees | Primary + workers |
| Antigravity | Dynamic subagents (2.0) | Parallel with workspace isolation | Unbounded |

The kit has 4 specialist agents (reviewer, researcher, architect, qa-engineer)
but no general-purpose implementer and no meta-agent that can coordinate others.

## Options considered

| Option | For | Against |
|---|---|---|
| Keep the orchestrator as a rule only | Zero overhead for small tasks | Cannot spawn subagents; parallelism impossible |
| Replace the rule with an orchestrator agent | Full multi-agent capability | Loses the lightweight single-agent path |
| Both: rule for single-agent, agent for multi-agent | Right tool for each scale | Two orchestration paths to maintain |
| Build a custom agent runtime in the MCP server | Maximum control | Competes with editors; statefulness breaks the architecture |

## Decision

**Both: the rule stays as the lightweight single-agent path; a new orchestrator
agent handles multi-agent coordination.** The rule gains a `can-invoke`
relationship to the orchestrator agent as an escalation path for complex tasks.

### Architectural boundaries

1. **The MCP server stays stateless.** The orchestrator is an agent definition —
   a document — not a service. The IDE runtime handles spawning, lifecycle, and
   message routing.

2. **Design for depth 2.** Orchestrator (depth 1) spawns flat workers (depth 2).
   Workers do not spawn further agents. A worker that needs research gets the
   research skill injected directly rather than spawning a researcher
   sub-sub-subagent. This works within Claude Code's depth-3 ceiling and avoids
   fragile depth-dependent behaviour.

3. **Dynamic skills are prompt composition, not persistence.** The orchestrator
   may compose task-specific instructions inline in a subagent's prompt. These
   are not resources, do not survive the session, and require no new API.

4. **Delegation requires user approval.** The orchestrator outputs a delegation
   plan (agents, skills, tasks, estimated parallelism) and waits for explicit
   confirmation before spawning. This mirrors existing workflow phase gates.

### New agent definitions

| Agent | Purpose |
|---|---|
| `developer` | General-purpose implementer. Receives skills, writes code. The missing counterpart to the 4 specialists. |
| `orchestrator` | Meta-agent. Analyses requests, proposes delegation plans, spawns and coordinates workers. |

### MVP scope

1. `developer` agent definition
2. `orchestrator` agent definition with delegation plan pattern
3. Documentation of the two-level spawning model
4. No dynamic skills, no automatic loop delegation, no runtime skill injection

### What this does not build

- An agent runtime in the MCP server (stays stateless)
- Budget tracking (the editor enforces its own caps)
- Depth > 2 chaining (fragile and editor-dependent)
- Automatic delegation without user approval

## Consequences

- The kit gains a multi-agent capability that works on all three editors
- Small tasks still use the lightweight rule path with zero overhead
- The orchestrator agent definition becomes the most complex resource in the kit
- Future work (EPC-003 phases 2–3) can add dynamic skills and advanced patterns
  incrementally without changing the architecture
