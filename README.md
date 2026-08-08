# Common Rules Server

An MCP server that gives coding agents a shared, versioned set of **rules,
skills, agents, workflows, loops and hooks** — and configures the project around them.

Write your development process once. Every agent, in every editor, works to it.

```bash
uv sync --extra test
PYTHONPATH=src uv run pytest
```

## Documentation

This README is a hub. Everything else lives in the wiki.

**→ [Wiki](.docs/claude/README.md)**

| | |
|---|---|
| [What it is for](.docs/claude/product/PRD.md) | The problem, the requirements, the outcome |
| [System design](.docs/claude/architecture/SYSTEM-DESIGN.md) | How the server is put together |
| [Decisions](.docs/claude/architecture/adrs/ADR-001-unified-resource-model.md) | Why it is put together that way |
| [Setup](.docs/claude/onboarding/SETUP-GUIDE.md) | Getting it running in your editor |
| [Development guide](.docs/claude/engineering/DEVELOPMENT-GUIDE.md) | Working on this repository |
| [Agent BDD](.docs/claude/engineering/AGENT-BDD.md) | Agent-executed acceptance testing |
| [Roadmap](.docs/claude/tracking/ROADMAP.md) | Epics, tickets, findings |
| [Wiki template](.docs/template/README.md) | The reusable structure, for any project |

## Tools

| Tool | Purpose |
|---|---|
| `get_context()` | The whole map in one call — every resource, its description and its relationships, without instruction bodies |
| `get_resource(kind, name)` | One resource in full, with project configuration substituted in and its output template attached |
| `create_resource(...)` | Add a project-scoped resource; overrides a built-in of the same name without forking the kit |
| `setup_config()` | Configure the project: settings, commit-authorship hook, editor guidance, companion server report |
| `get_bdd_scenario(page)` | Walk the acceptance scenarios one at a time |
| `sync_to_ide(...)` | Export the whole kit into native editor files, so it works with this server switched off |

## What ships

45 resources — 4 always-applied rules, 24 skills (5 gated behind configuration
flags), 6 subagents, 4 workflows, 1 loop and 6 lifecycle hooks — plus 32 output
templates so reports come back in a predictable shape.

Everything is natural language. Nothing names an editor. Anything
environment-specific is a `{{PLACEHOLDER}}` resolved from
`.common-rules-server/config.env`, which the server writes with every setting
explained.

## Design

**One format, six kinds.** Every resource is Markdown with YAML frontmatter and
a `kind` field. One parser, one validator, uniform discovery.
→ [ADR-001](.docs/claude/architecture/adrs/ADR-001-unified-resource-model.md)

**Discovery is separate from retrieval.** `get_context` sends names and
descriptions; bodies arrive only when asked for. Sending the whole kit to
describe it would spend the context the call exists to inform.
→ [ADR-002](.docs/claude/architecture/adrs/ADR-002-progressive-disclosure.md)

**Resources know their neighbours.** Each declares where it comes from, where it
goes and what it may invoke — and which of those edges are required. The process
lives in the edges, not the files.

**Report before writing.** Setup never modifies editor-wide MCP configuration on
its own. That file is shared with every project you open, so a wrong entry breaks
all of them.
→ [ADR-003](.docs/claude/architecture/adrs/ADR-003-report-not-write.md)

**Automations that do not depend on cooperation.** Rules are guidance an agent
can skim or ignore. Hooks fire from the editor itself. One hook definition
generates native configuration for Cursor, Claude Code and Antigravity — so the
secret guard, the destructive-command guard and the session briefing hold
whether or not the agent reads anything.
→ [ADR-005](.docs/claude/architecture/adrs/ADR-005-hooks-over-guidance.md)

**Every resource interrogates itself.** Each carries a `self_check`
questionnaire — specific questions it must answer before reporting done. *Did I
watch the test fail, or write it green? What did I not do?* It converts "I
implemented it" into a claim that can be checked.

**Run it without the server.** `sync_to_ide` exports everything into each
editor's own layout. Reaching a resource through the server costs a tool call
every time; reaching it natively costs nothing at run time. The export is pure
string transformation, so re-running it is free.
→ [ADR-006](.docs/claude/architecture/adrs/ADR-006-native-sync.md)

**Your commits stay yours.** A `commit-msg` hook removes co-author and
"generated with" trailers injected by AI agents. Human co-author trailers are
preserved — those are true statements about who wrote the code.
→ [ADR-004](.docs/claude/architecture/adrs/ADR-004-commit-authorship.md)

## Quick start

Point your editor's MCP configuration at the server:

```json
{
  "mcpServers": {
    "common-rules": {
      "command": "uv",
      "args": ["--directory", "/absolute/path/to/common-rules-server", "run", "common-rules"]
    }
  }
}
```

Then, in any project, ask the agent to run `setup_config()`. It writes the
configuration file, installs the commit hook, and drops orchestration guidance
where your editor will read it. Read `next_steps` in the response — it lists what
still needs an answer from you.

To stop paying a tool call per resource, or to use the kit without this server
running at all:

```bash
# ask the agent to run: sync_to_ide()
```

It writes every rule, skill, subagent and hook into `.cursor/`, `.claude/` and
`.agents/` in the layout each editor documents. Re-run it after changing a
resource — generated files are overwritten, so edit the resource, not the output.

Full instructions: **[Setup Guide](.docs/claude/onboarding/SETUP-GUIDE.md)**
