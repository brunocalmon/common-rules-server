[← Wiki Hub](../README.md)

---

# Development Guide

## Layout

```
src/common_rules_server/
├── mcp_server.py           tool surface
├── service/                one service per concern
├── util/                   parsing and placeholder resolution
└── resources/              the built-in kit (data, not code)
    ├── rules/ skills/ agents/ workflows/ loops/
    ├── optional/           gated behind config flags
    └── templates/          report skeletons
src/test/                   mirrors the source layout
agent_bdd.feature           agent-executed acceptance scenarios
```

## Commands

| Purpose | Command |
|---|---|
| Install | `uv sync --extra test` |
| Tests | `PYTHONPATH=src uv run pytest` |
| One file | `PYTHONPATH=src uv run pytest src/test/service/test_config_service.py` |
| Run the server | `PYTHONPATH=src uv run common-rules` |

## Adding a resource

Write a Markdown file under the directory for its kind. There is no registration
step — resources are data, and the integrity suite will pick it up.

It must have `kind`, `name`, `description`, the field its kind requires, a
relationship table in prose as well as YAML, and an output template if it
produces a report. The integrity suite enforces all of this, plus: the filename
matches the name, references resolve, placeholders correspond to real config
keys, no pseudo-code, no editor names.

## Adding a configuration key

Add a `ConfigKey` to `CONFIG_SCHEMA` in `config_service.py`. Give it a
description written for someone who has not read the code, and either a default
or `needs_input=True`. Nothing else needs changing: the file writer, the resolver
and the reporting all read the schema.

## Testing against a local build

Add a second MCP server entry pointing at the working copy, alongside the
released one rather than replacing it:

```json
"common-rules-local": {
  "command": "uv",
  "args": ["--directory", "/path/to/common-rules-server", "run", "common-rules"]
}
```

Keeping both means the released server stays available if the working copy is
mid-change. The editor caches the tool list at start-up, so a new tool needs the
connection restarted before it appears.

## Conventions

Natural language in resources — no pseudo-code. Explain why a step matters where
the reason is not obvious; an instruction whose purpose is understood survives
situations its author did not foresee.

Services take `project_root` and default to the working directory. Nothing reads
global state at import.

Failures are returned as data with a `hint`, not raised. An agent cannot catch an
exception across the MCP boundary.


---

← Previous: [ADR-004 Commit Authorship](../architecture/adrs/ADR-004-commit-authorship.md) · Next: [Testing Strategy](TESTING-STRATEGY.md) →
