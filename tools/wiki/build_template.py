"""Generates the reusable engineering wiki template."""

import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from wikigen import build, check_links

ROOT = Path(__file__).resolve().parents[2] / ".docs" / "template"

PAGES = [
    ("README.md", "Wiki Hub", """
# Engineering Wiki — Template

A reusable documentation structure for any software project. Copy this
directory, rename it after your project, replace the placeholder content, and
delete what you do not need.

Documentation lives in the repository beside the code it describes, changes in
the same pull request as the code it describes, and is reviewed the same way.

## Sections

| Section | Holds | Read it when |
|---|---|---|
| [Product](product/PRD-TEMPLATE.md) | What is being built and for whom | Deciding whether something is in scope |
| [Architecture](architecture/SYSTEM-DESIGN-TEMPLATE.md) | Structure, and the decisions behind it | Changing how components fit together |
| [Engineering](engineering/CODING-STANDARDS-TEMPLATE.md) | How code is written, tested and reviewed | Writing or reviewing code |
| [Operations](operations/PLAYBOOK-TEMPLATE.md) | Running it, and recovering when it breaks | Deploying, or responding to an incident |
| [Onboarding](onboarding/SETUP-GUIDE-TEMPLATE.md) | Getting productive from nothing | Your first day |
| [Tracking](tracking/WORKFLOW.md) | Roadmap, epics, tickets, findings | Planning or picking up work |

## Principles

**No zombie documentation.** A page that describes a version of the system that
no longer exists is worse than no page, because it is trusted. Retire pages
through the [Documentation Protocol](DOCUMENTATION-PROTOCOL.md) rather than
leaving them to rot.

**Minimum viable documentation.** A few accurate pages beat many stale ones.
Every page you add is a page somebody has to keep true.

**The code is the source of truth for behaviour; documentation is the source of
truth for intent.** When they disagree about *what* the system does, the code
wins. Documentation exists to record *why*, which is the part that cannot be
recovered by reading the code.

**Write for the person who arrives without context.** They do not know the
history, the abbreviations, or which decisions are still live.
"""),

    ("DOCUMENTATION-PROTOCOL.md", "Documentation Protocol", """
# Documentation Protocol

How decisions are recorded, superseded and navigated.

## The hub rule

The `README.md` at the repository root is a hub. It states what the project is
in a few lines and links into this wiki. It does not hold architecture, guides
or long-form explanation — those live here, where they can be organised and
retired properly.

A root README that accumulates content becomes the only page anyone reads, and
then the only page anyone maintains.

## The golden rule

**A decision is never overwritten silently.**

When a new document changes how an existing one should be read, both ends are
updated. A reader who arrives at either page is sent to the other.

1. **Impact footer.** The new document ends with a footer stating what it
   changes elsewhere.
2. **Inline marker.** At the point of change, the new document carries
   `[→ overrides <DOC> §<section>]`.
3. **Mirror marker.** The superseded document is edited to carry
   `[← overridden by <DOC> §<section>]` at the affected point.

Step three is the one that gets skipped, and it is the one that matters. Without
it, a reader landing on the old page has no way to know it is stale.

## Relationship vocabulary

| Relationship | Meaning | Status of the older text |
|---|---|---|
| **Extends** | Adds something the older document did not cover | Still current |
| **Refines** | Changes the interpretation without contradicting | Current; read both |
| **Overrides** | Replaces a specific passage | That passage is obsolete |
| **Supersedes** | Replaces the document entirely | Obsolete; kept as history |
| **Depends on** | Relies on the older document to make sense | Current and load-bearing |

## Impact footer format

```markdown
---

**Document impact**

| Relationship | Target | Section | Summary |
|---|---|---|---|
| Overrides | ADR-004 | §Storage | Object storage replaces the local disk cache |
```

## Checklist

Before merging a documentation change:

- [ ] Does this change how another document should be read?
- [ ] Impact footer added?
- [ ] Inline `[→ overrides ...]` marker placed?
- [ ] Mirror `[← overridden by ...]` marker added to the older document?
- [ ] Navigation links from the hub still resolve?
- [ ] Does the tracker reflect this work?
"""),

    ("product/PRD-TEMPLATE.md", "Product Requirements", """
# PRD — <Product or feature name>

**Status:** Draft | In review | Approved | Shipped
**Owner:** <name>
**Last reviewed:** <YYYY-MM-DD>

## Problem

What is wrong today, stated from the position of the person experiencing it.
Not the absence of your solution — the problem that exists whether or not you
build anything.

## Evidence

Why we believe this problem is real and worth solving. Support tickets, usage
data, interviews. A problem with no evidence is a hypothesis.

## Who it affects

| Audience | Their situation | What they need |
|---|---|---|
| <role> | <context> | <outcome> |

## Success

How we will know this worked, measured from outside the system.

| Measure | Today | Target | How measured |
|---|---|---|---|
| <metric> | <baseline> | <target> | <method> |

## Requirements

| # | Requirement | Priority | Rationale |
|---|---|---|---|
| R1 | <what the system must do> | Must / Should / Could | <why> |

## Explicitly out of scope

What this does not cover, and why. This section prevents more disagreement than
any other, so be specific rather than diplomatic.

## Open questions

| # | Question | Blocks | Owner |
|---|---|---|---|
"""),

    ("product/USER-JOURNEY-TEMPLATE.md", "User Journey", """
# User Journey — <journey name>

**Persona:** <who>
**Trigger:** <what starts this>
**Successful outcome:** <where they end up>

## Steps

| # | What they do | What they see | What can go wrong |
|---|---|---|---|
| 1 | <action> | <system response> | <failure mode> |

## Where it hurts today

| Step | Problem | Evidence | Severity |
|---|---|---|---|

## Where it should end up

Describe the improved journey, not the implementation that delivers it.

## Notes

Journeys are for reasoning about the whole path. A step that is individually
fine can still make the journey fail — most abandonment happens at handoffs
between steps rather than inside them.
"""),

    ("architecture/SYSTEM-DESIGN-TEMPLATE.md", "System Design", """
# System Design — <system name>

**Status:** Current | Superseded
**Last reviewed:** <YYYY-MM-DD>

## Purpose

What this system does, in a few sentences, for a reader who has never seen it.

## Context

What sits around it: who calls it, what it calls, what it stores.

```
<diagram or ASCII sketch>
```

## Components

| Component | Responsibility | Owns | Depends on |
|---|---|---|---|
| <name> | <single responsibility> | <data or behaviour> | <other components> |

A component with more than one responsibility in this table is a component that
should probably be two.

## Data

| Store | Contents | Lifetime | Consistency |
|---|---|---|---|

## Key flows

Walk the important paths end to end. One heading per flow, numbered steps.

## Constraints

Anything that limits the design and is not negotiable: compliance, latency
budgets, existing systems that cannot change, team size.

## Known weaknesses

Where this design is understood to be inadequate, and what would trigger
revisiting it. Every design has these; recording them stops the next person
rediscovering them by accident.

## Decisions

Individual decisions are recorded as ADRs, not here.
See [ADR template](adrs/ADR-TEMPLATE.md).
"""),

    ("architecture/adrs/ADR-TEMPLATE.md", "Architecture Decision Record", """
# ADR-<NNN> — <decision, stated as a choice made>

**Status:** Proposed | Accepted | Superseded by ADR-<NNN> | Deprecated
**Date:** <YYYY-MM-DD>
**Deciders:** <names>

## Context

The situation that forced a decision. Include the constraints that were real at
the time — a decision that looks wrong later is usually a decision whose
constraints were not written down.

## Options considered

| Option | For | Against |
|---|---|---|
| <option> | <benefits> | <costs> |

An ADR with one option is not a decision record; it is a description.

## Decision

What was chosen, stated plainly.

## Consequences

What becomes easier, what becomes harder, and what is now expensive to reverse.
Include the consequences you dislike — those are the ones a future reader needs.

## Revisit when

The conditions that would justify reopening this. Without them, the decision
becomes permanent by default rather than by choice.

---

**Document impact**

| Relationship | Target | Section | Summary |
|---|---|---|---|
"""),

    ("engineering/CODING-STANDARDS-TEMPLATE.md", "Coding Standards", """
# Coding Standards

Conventions that are not enforced automatically. Anything a formatter or linter
can enforce belongs in its configuration, not on this page — a rule that is
written down but not enforced is a rule that is followed inconsistently.

## Automated

| Concern | Tool | Configuration | Command |
|---|---|---|---|
| Formatting | <tool> | <path> | `<command>` |
| Linting | <tool> | <path> | `<command>` |
| Types | <tool> | <path> | `<command>` |

## Conventions

### Naming

<Project-specific naming that a linter cannot check.>

### Structure

<Where things go, and why.>

### Errors

<How failures are represented, propagated and logged.>

### Comments

Comments explain why, not what. A comment restating the code is a maintenance
liability; a comment recording a non-obvious reason is the most valuable line
in the file.

## Definition of done

- [ ] Behaviour covered by a test that fails without the change
- [ ] Build, tests and lint pass
- [ ] Documentation updated where behaviour or interfaces changed
- [ ] Reviewed by someone who did not write it
"""),

    ("engineering/TESTING-STRATEGY-TEMPLATE.md", "Testing Strategy", """
# Testing Strategy

## Levels

| Level | Verifies | Speed | When it runs |
|---|---|---|---|
| Unit | One unit in isolation | Fast | Every save |
| Integration | Units against real collaborators | Medium | Every push |
| Acceptance | Behaviour from outside | Slow | Before merge |

## What makes a test worth keeping

A test earns its place by failing when the behaviour breaks and passing
otherwise. Two failure modes to watch for:

- **Tautological.** The assertion recomputes the expected value the way the code
  does, so it passes whatever the code does.
- **Implementation-coupled.** Mocking internals or asserting on private state,
  so it fails on refactors and passes on real breakage.

Expected values should come from an independent source: a worked example, a
specification, a hand-computed result.

## Coverage

Coverage is a weak signal, useful for finding untested areas and useless as a
target. Fully covered code can be untested in every way that matters.

| Measure | Target | Rationale |
|---|---|---|

## Commands

| Purpose | Command |
|---|---|
| All tests | `<command>` |
| Coverage | `<command>` |
"""),

    ("engineering/PR-TEMPLATE.md", "Pull Request Template", """
# Pull Request Template

Copy into `.github/pull_request_template.md`.

```markdown
## What and why

<What changes, and the problem it solves. Link the ticket.>

## How

<Approach, and anything a reviewer would otherwise have to reverse-engineer.>

## Alternatives considered

<What else was tried or rejected, and why. Omit if genuinely obvious.>

## Verification

- [ ] Tests added or updated, and they fail without this change
- [ ] Build, tests and lint pass locally
- [ ] Documentation updated where behaviour or interfaces changed
- [ ] Tracker updated

## Risk

<What could break, and how it would be noticed. "None" is rarely true.>

## Rollback

<How to undo this if it goes wrong.>
```
"""),

    ("operations/PLAYBOOK-TEMPLATE.md", "Operational Playbook", """
# Playbook — <operation name>

**Applies to:** <system>
**Risk:** Low | Medium | High
**Typical duration:** <time>

## When to use this

The situation this playbook addresses, and the situations it does not.

## Before you start

- [ ] <precondition>
- [ ] <access or credential needed>
- [ ] <who to notify>

## Steps

| # | Action | Command | Expected result |
|---|---|---|---|
| 1 | <action> | `<command>` | <what you should see> |

## Verification

How to confirm it worked, from outside the system.

## Rollback

| # | Action | Command |
|---|---|---|

State the point of no return, if there is one. A playbook without a rollback
section is a playbook people are afraid to run.

## If it goes wrong

Who to contact, what to capture before changing anything, and where to record
what happened.
"""),

    ("operations/POST-MORTEM-TEMPLATE.md", "Post-Mortem", """
# Post-Mortem — <incident>

**Date:** <YYYY-MM-DD>
**Duration:** <start> to <end>
**Impact:** <who was affected and how>
**Severity:** <level>

This document is blameless. It examines how the system allowed the failure, not
who performed the action. A post-mortem that assigns fault produces people who
hide incidents, which is strictly worse than the incident.

## Summary

What happened, in a short paragraph a reader outside the team can follow.

## Timeline

| Time | Event | Who noticed | How |
|---|---|---|---|

## Root cause

The condition that made this possible — not the trigger. The trigger is what
happened that day; the root cause is why that was enough to break things.

## Contributing factors

What made it worse, slower to detect, or harder to resolve.

## What went well

Genuinely. Detection, tooling, communication. These are the things to protect.

## Actions

| # | Action | Type | Owner | Ticket |
|---|---|---|---|---|
| 1 | <action> | Prevent / Detect / Mitigate | <name> | <link> |

Prefer actions that make the class of failure impossible over actions that make
this instance unlikely. "Be more careful" is not an action.
"""),

    ("onboarding/SETUP-GUIDE-TEMPLATE.md", "Setup Guide", """
# Setup Guide

From nothing to a running system and a passing test suite.

## Prerequisites

| Tool | Version | Install |
|---|---|---|

## Steps

```bash
# 1. Clone
git clone <url> && cd <project>

# 2. Install dependencies
<command>

# 3. Configure
<command>

# 4. Verify
<command>
```

You are set up when `<verification command>` passes.

## Common problems

| Symptom | Cause | Fix |
|---|---|---|

## First week

- [ ] Read the [PRD](../product/PRD-TEMPLATE.md) — what this is for
- [ ] Read the [System Design](../architecture/SYSTEM-DESIGN-TEMPLATE.md) — how it fits together
- [ ] Read the [Coding Standards](../engineering/CODING-STANDARDS-TEMPLATE.md) — how we write here
- [ ] Read the [Workflow](../tracking/WORKFLOW.md) — how work moves
- [ ] Pick up a ticket marked good-first-issue

## Who to ask

| Topic | Person |
|---|---|
"""),

    ("tracking/WORKFLOW.md", "Development Workflow", """
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
"""),

    ("tracking/ROADMAP-TEMPLATE.md", "Roadmap", """
# Roadmap

**Last updated:** <YYYY-MM-DD>

## Now

| Epic | Outcome | Status | Progress |
|---|---|---|---|
| [EPC-001](epics/EPC-TEMPLATE.md) | <outcome> | In Progress | 3/7 |

## Next

| Epic | Outcome | Depends on |
|---|---|---|

## Later

| Epic | Outcome | Why not now |
|---|---|---|

## Not doing

| Idea | Why not |
|---|---|

This section is as valuable as the others. An idea that is rejected without a
record gets proposed again every few months.

## Progress

| Status | Count |
|---|---|
| Done | |
| In Progress | |
| Backlog | |
| Blocked | |
"""),

    ("tracking/epics/EPC-TEMPLATE.md", "Epic Template", """
# EPC-<NNN> — <epic name>

**Status:** Backlog | In Progress | Done
**Owner:** <name>
**Roadmap:** [Roadmap](../ROADMAP-TEMPLATE.md)

## Outcome

What is true when this epic is done, stated as an observable outcome rather than
a list of work.

## Why now

What makes this worth doing before the alternatives.

## Tickets

| Ticket | Title | Type | Status |
|---|---|---|---|
| [TKT-001](../tickets/TKT-TEMPLATE.md) | <title> | Feature | Backlog |

## Out of scope

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|

## Definition of done

- [ ] Every ticket Done
- [ ] Documentation updated
- [ ] Outcome above is demonstrably true
"""),

    ("tracking/tickets/TKT-TEMPLATE.md", "Ticket Template", """
# TKT-<NNN> — <title>

**Type:** Feature | Bug | Chore | Spike | Follow-up
**Status:** Backlog | In Progress | Review | Signoff | Done | Blocked
**Epic:** [EPC-<NNN>](../epics/EPC-TEMPLATE.md)
**Blocked by:** <ticket or none>

## What

One paragraph. What changes, and what becomes possible afterwards.

## Why

The reason this is worth doing. A ticket without one gets done in the wrong way,
because the person doing it has to guess what matters.

## Acceptance criteria

- [ ] <observable, checkable statement>
- [ ] <another>

Write these before starting. Written afterwards they describe what was built
rather than what was wanted.

## How it will be verified

The specific check that proves this works. Name the command, the scenario, or
the observation.

## Notes

Constraints, prior art, links.

## Log

| Date | Status | Note |
|---|---|---|
| <YYYY-MM-DD> | Backlog | Created |
"""),

    ("tracking/findings/FND-TEMPLATE.md", "Finding Template", """
# FND-<NNN> — <finding>

**Severity:** Critical | High | Medium | Low
**Status:** Open | Triaged | Ticketed | Won't fix
**Found during:** <what work surfaced this>
**Found:** <YYYY-MM-DD>

## What

What is wrong. Be specific enough that someone else can confirm it without
asking you.

## Where

`<file>:<line>` or `<component>`

## Why it matters

The concrete consequence. A finding with no stated consequence cannot be
prioritised, and will sit open forever.

## Evidence

How this was observed. Output, a failing case, a trace.

## Suggested fix

What would resolve it, and roughly what that costs.

## Why it was not fixed now

Findings are recorded rather than fixed on sight so that the change under review
stays the change that was planned. Record what made this out of scope.
"""),
]

if __name__ == "__main__":
    shutil.rmtree(ROOT, ignore_errors=True)
    build(ROOT, PAGES)
    broken = check_links(ROOT)
    print(f"template pages: {len(PAGES)}")
    print("broken links:", broken or "none")
