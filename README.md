# Common Rules Server

An MCP server that gives coding agents a shared, versioned set of **rules,
skills, agents, workflows and loops** — and configures the project around them.

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

## What ships

35 resources — 2 always-applied rules, 24 skills (5 gated behind configuration
flags), 4 subagents, 4 workflows, 1 loop — plus 29 output templates so reports
come back in a predictable shape.

Everything is natural language. Nothing names an editor. Anything
environment-specific is a `{{PLACEHOLDER}}` resolved from
`.common-rules-server/config.env`, which the server writes with every setting
explained.

## Design

**One format, five kinds.** Every resource is Markdown with YAML frontmatter and
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

Full instructions: **[Setup Guide](.docs/claude/onboarding/SETUP-GUIDE.md)**
