# Common Rules Server — Wiki

An MCP server that gives coding agents a shared, versioned set of rules, skills,
agents, workflows and loops, and configures the project around them.

Built from [`.docs/template`](../template/README.md). See the
[Documentation Protocol](DOCUMENTATION-PROTOCOL.md) before changing anything here.

## Sections

| Section | Holds |
|---|---|
| [Product](product/PRD.md) | What this is for, and for whom |
| [System Design](architecture/SYSTEM-DESIGN.md) | How the server is put together |
| [Decisions](architecture/adrs/ADR-001-unified-resource-model.md) | Why it is put together that way |
| [Hooks](architecture/adrs/ADR-005-hooks-over-guidance.md) | Automations that hold without agent cooperation |
| [Native sync](architecture/adrs/ADR-006-native-sync.md) | Running the kit with the server switched off |
| [Development Guide](engineering/DEVELOPMENT-GUIDE.md) | Working on this repository |
| [Testing Strategy](engineering/TESTING-STRATEGY.md) | What is tested, and how |
| [Agent BDD](engineering/AGENT-BDD.md) | Agent-executed acceptance testing |
| [Rollback](operations/ROLLBACK-PLAYBOOK.md) | Undoing this refactor |
| [Setup](onboarding/SETUP-GUIDE.md) | Getting it running |
| [Roadmap](tracking/ROADMAP.md) | Epics, tickets, findings |

## Status

All six epics are Done. 781 tests pass. One finding remains open, deliberately
deferred — see [Roadmap](tracking/ROADMAP.md).


---

Next: [Documentation Protocol](DOCUMENTATION-PROTOCOL.md) →
