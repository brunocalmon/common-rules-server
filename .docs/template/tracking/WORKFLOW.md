[← Wiki Hub](../README.md)

---

# Development Workflow

Work is tracked in the repository, in Markdown, beside the code. The structure
mirrors an issue tracker so the process is familiar, and lives in git so it is
versioned and reviewable with the change it describes.

## Hierarchy

```
Roadmap      what we intend to do and in what order
  └─ Epic       a coherent body of work with an outcome
       └─ Ticket   one unit of work, finishable in a sitting
Findings     problems noticed but deliberately not fixed now
```

## Ticket lifecycle

| Status | Meaning | Leaves when |
|---|---|---|
| **Backlog** | Refined, not started | Someone picks it up |
| **In Progress** | Actively being worked | The work is complete |
| **Review** | Code written, awaiting review | Review passes |
| **Signoff** | Reviewed, awaiting functional check | Someone confirms it does what the ticket said |
| **Done** | Verified and merged | — |
| **Blocked** | Cannot proceed | The blocker clears |

**Signoff is separate from Review on purpose.** Review asks whether the code is
good. Signoff asks whether the thing the ticket promised actually happens. Work
that passes review and fails signoff is common, and collapsing the two hides it.

## Ticket types

| Type | For |
|---|---|
| Feature | New capability |
| Bug | Something behaving incorrectly |
| Chore | Necessary work with no user-visible outcome |
| Spike | Time-boxed investigation producing a decision |
| Follow-up | Work deliberately deferred from another ticket |

## Rules

**One ticket in progress at a time.** Parallel work in one person's hands means
several things half-done and nothing finished.

**A ticket states how it will be verified** before it starts. Written
afterwards, the verification describes what was built rather than what was
wanted.

**Findings are not fixed on sight.** Something noticed while doing other work is
recorded as a finding and triaged later. Fixing it immediately expands the
change under review and delays the work that was actually planned.

**Status is updated when it changes, not in a batch.** A tracker updated
retrospectively records intentions rather than events.

## Files

| Artefact | Location | Template |
|---|---|---|
| Roadmap | `tracking/ROADMAP.md` | [ROADMAP-TEMPLATE.md](ROADMAP-TEMPLATE.md) |
| Epics | `tracking/epics/EPC-<NNN>.md` | [EPC-TEMPLATE.md](epics/EPC-TEMPLATE.md) |
| Tickets | `tracking/tickets/TKT-<NNN>.md` | [TKT-TEMPLATE.md](tickets/TKT-TEMPLATE.md) |
| Findings | `tracking/findings/FND-<NNN>.md` | [FND-TEMPLATE.md](findings/FND-TEMPLATE.md) |


---

← Previous: [Setup Guide](../onboarding/SETUP-GUIDE-TEMPLATE.md) · Next: [Roadmap](ROADMAP-TEMPLATE.md) →
