---
kind: rule
name: orchestrator
description: >-
  Route a request to the right resources. A map of which work shape calls for
  which skills, and which questions to settle before starting. ONLY apply when explicitly requested.
type: Always
relationships:
  comes-from:
    - target: /general
      required: true
      note: Workspace state is established first
  can-invoke:
    - target: /grill-me
      required: true
      note: Mandatory before any non-trivial work — settle requirements first
    - target: /feature-dev
      required: false
      note: Build something new or restructure
    - target: /bug-fix
      required: false
      note: Something is broken
    - target: /docs-gen
      required: false
      note: Documentation changes
    - target: /bdd-cycle
      required: false
      note: Prove the system behaves
    - target: /diagnose
      required: false
    - target: /verify
      required: false
    - target: /review
      required: false
    - target: /docs
      required: false
    - target: /onboard
      required: false
      note: When the project has no configuration yet
    - target: agents/orchestrator
      required: false
      note: Escalation path for work that splits into independent parallel parts
  output: templates/orchestrator.md
self_check:
  - Did I state which route I chose and why, so the user could redirect me?
  - Did I check whether requirements were settled before routing to implementation?
  - Am I following a required edge, or skipping one because it seemed unnecessary?
  - Did I use context-mode and code-review-graph before asking the user questions I could answer myself?
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /general | yes | Workspace state established first |
| can-invoke | /grill-me | yes | Settle requirements before any non-trivial work |
| can-invoke | /feature-dev | no | Build something new or restructure |
| can-invoke | /bug-fix | no | Something is broken |
| can-invoke | /docs-gen | no | Documentation changes |
| can-invoke | /bdd-cycle | no | Prove the system behaves |
| can-invoke | /diagnose | no | Something is broken and needs reproduction first |
| can-invoke | /verify | no | After any code change |
| can-invoke | /review | no | After verification passes |
| can-invoke | /docs | no | Behaviour or architecture changed |
| can-invoke | /onboard | no | Project not configured yet |
| can-invoke | agents/orchestrator | no | Work splits into parallel parts |
| output | templates/orchestrator.md | yes | Routing summary |

## Instructions

> [!IMPORTANT]
> **EXPLICIT INVOCATION ONLY**
> Do not run orchestration routes automatically on every request. Only execute this workflow when the user explicitly asks you to route a request, or run `/orchestrator`.

Match the request to a shape, then follow that row. These are routes, not rails:
depart from them when the work calls for it, and say that you are doing so.

| Shape of the request | Route | Workflow |
|---|---|---|
| Build something new | Settle requirements, then implement, verify, review | /feature-dev |
| Something is broken | Reproduce first, then fix and prove it stays fixed | /bug-fix |
| Change how it is documented | Assess gaps, write, review | /docs-gen |
| Restructure without changing behaviour | Check documented architecture, implement, verify | /feature-dev |
| Understand something | Research against primary sources, then interrogate | /research then /grill-me |
| Prove the system behaves | Generate scenarios, execute, review coverage | /bdd-cycle |
| First time in this project | Configure, then orient | /onboard |

Before starting, settle these. Each is cheap to answer now and expensive later.

- **Are the requirements actually settled?** For anything beyond a small,
  obvious change, unsettled requirements are the most common cause of wasted
  work. Run /grill-me — this is required, not optional.
- **Is there a documented way this project does this?** Use `context-mode` to
  search project history and decisions before inventing a process.
- **Does this need to be reproducible before it can be fixed?** If so, /diagnose
  comes before any edit.
- **What does the dependency graph say?** Use `code-review-graph` to understand
  what the change touches before proposing a route.
- **Which of these steps does the user actually want?** Say which route you are
  taking and let them redirect you.

Prefer a required edge over your own judgement. A resource that declares
`required: true` on its next step is stating that skipping it produces work that
looks finished and is not.

## When to hand off to the orchestrator agent

This rule routes one agent through one task at a time. That is the right shape
for most work and costs nothing extra.

Hand off to `agents/orchestrator` when the work genuinely splits into parts that
do not need each other's output — several independent modules, or an
implementation that can be reviewed by a different reader while it is written.
The agent runs in its own context window and can put workers on those parts in
parallel.

Do not hand off because a task is merely large. Sequential work stays sequential
whoever runs it, and delegation multiplies token cost by the number of workers.
Say which of the two you judged it to be, and let the user overrule you.

## Standing obligations

Three things apply to every task regardless of the route taken.

**/self-review** — every resource carries a `self_check`. Extend it before you
start, answer it before you finish, and treat an unanswered question as work not
done.

**/session-receipt** — close the response with the receipt. Its verification
field must name something you observed, not the work you performed.

**Enforcement is not advisory.** Some automations run from the editor itself:
secrets are blocked from reaching the transcript, destructive commands ask first,
commit authorship is protected. If one of them stops you, that is the system
working — do not route around it. Where you disagree, say so and let the user
decide.
