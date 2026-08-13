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

**→ [Wiki](.docs/wiki/README.md)**

| | |
|---|---|
| [What it is for](.docs/wiki/product/PRD.md) | The problem, the requirements, the outcome |
| [System design](.docs/wiki/architecture/SYSTEM-DESIGN.md) | How the server is put together |
| [Decisions](.docs/wiki/architecture/adrs/ADR-001-unified-resource-model.md) | Why it is put together that way |
| [Setup](.docs/wiki/onboarding/SETUP-GUIDE.md) | Getting it running in your editor |
| [Development guide](.docs/wiki/engineering/DEVELOPMENT-GUIDE.md) | Working on this repository |
| [Agent BDD](.docs/wiki/engineering/AGENT-BDD.md) | Agent-executed acceptance testing |
| [Roadmap](.docs/wiki/tracking/ROADMAP.md) | Epics, tickets, findings |
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

52 resources — 7 always-applied rules, 24 skills (5 gated behind configuration
flags), 6 subagents, 4 workflows, 1 loop and 10 lifecycle hooks — plus 32 output
templates so reports come back in a predictable shape.

Everything is natural language. Nothing names an editor. Anything
environment-specific is a `{{PLACEHOLDER}}` resolved from
`.common-rules-server/config.env`, which the server writes with every setting
explained.

## Design

**One format, six kinds.** Every resource is Markdown with YAML frontmatter and
a `kind` field. One parser, one validator, uniform discovery.
→ [ADR-001](.docs/wiki/architecture/adrs/ADR-001-unified-resource-model.md)

**Discovery is separate from retrieval.** `get_context` sends names and
descriptions; bodies arrive only when asked for. Sending the whole kit to
describe it would spend the context the call exists to inform.
→ [ADR-002](.docs/wiki/architecture/adrs/ADR-002-progressive-disclosure.md)

**Resources know their neighbours.** Each declares where it comes from, where it
goes and what it may invoke — and which of those edges are required. The process
lives in the edges, not the files.

**Report before writing.** Setup never modifies editor-wide MCP configuration on
its own. That file is shared with every project you open, so a wrong entry breaks
all of them.
→ [ADR-003](.docs/wiki/architecture/adrs/ADR-003-report-not-write.md)

**Automations that do not depend on cooperation.** Rules are guidance an agent
can skim or ignore. Hooks fire from the editor itself. One hook definition
generates native configuration for Cursor, Claude Code and Antigravity — so the
secret guard, the destructive-command guard and the session briefing hold
whether or not the agent reads anything.
→ [ADR-005](.docs/wiki/architecture/adrs/ADR-005-hooks-over-guidance.md)

**Every resource interrogates itself.** Each carries a `self_check`
questionnaire — specific questions it must answer before reporting done. *Did I
watch the test fail, or write it green? What did I not do?* It converts "I
implemented it" into a claim that can be checked.

**Run it without the server.** `sync_to_ide` exports everything into each
editor's own layout. Reaching a resource through the server costs a tool call
every time; reaching it natively costs nothing at run time. The export is pure
string transformation, so re-running it is free.
→ [ADR-006](.docs/wiki/architecture/adrs/ADR-006-native-sync.md)

**Your commits stay yours.** A `commit-msg` hook removes co-author and
"generated with" trailers injected by AI agents. Human co-author trailers are
preserved — those are true statements about who wrote the code.
→ [ADR-004](.docs/wiki/architecture/adrs/ADR-004-commit-authorship.md)

## Quick start

Point your editor's MCP configuration at the server. Two ways, and they can
coexist — give them different names and both appear.

**Published image** — nothing to build, and the version is pinned:

```json
{
  "mcpServers": {
    "common-rules": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-v", "/absolute/path/to/your/project:/project",
        "-w", "/project",
        "brunocalmon/common-rules-server:0.2.0"
      ]
    }
  }
}
```

The mount is not optional. The server reads and writes inside the project it is
configuring — `.common-rules-server/config.env`, the commit hook, the native
exports — so it needs the project on a path it can reach, and `-w` is what makes
that path its working directory. Tags follow the `version` in `pyproject.toml`;
there is no `latest`.

**From source** — for working on the kit itself, or running an unreleased branch:

```json
{
  "mcpServers": {
    "common-rules-local": {
      "command": "uv",
      "args": ["--directory", "/absolute/path/to/common-rules-server", "run", "common-rules"]
    }
  }
}
```

No mount, because it already runs on the host and inherits the editor's working
directory. This is the one to use when the published image is behind the branch
you are testing.

Then, in any project, ask the agent to run `setup_config()`. It writes the
configuration file, installs the commit hook, and drops orchestration guidance
where your editor will read it. Read `next_steps` in the response — it lists what
still needs an answer from you.

To stop paying a tool call per resource, or to use the kit without this server
running at all:

```bash
# ask the agent to run: sync_to_ide()
```

It writes every rule, skill, subagent and hook into the layout your editor
documents. With no argument it configures **only the editors the project shows
evidence of using** — a project that runs Claude Code gets `.claude/` and
`CLAUDE.md`, and no `.cursor/` or `.agents/` it will never read. Name them
explicitly to override that: `sync_to_ide(ides=["cursor", "claude"])`. When
nothing is detected it writes nothing and asks, rather than guessing.

Re-run it after changing a resource — generated files are overwritten, so edit
the resource, not the output.

Full instructions: **[Setup Guide](.docs/wiki/onboarding/SETUP-GUIDE.md)**
