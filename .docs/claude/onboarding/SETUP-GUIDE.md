[← Wiki Hub](../README.md)

---

# Setup Guide

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Python | 3.11+ | |
| uv | recent | Dependency and run management |
| git | any | Required for commit authorship protection |

## Install

```bash
git clone <url> && cd common-rules-server
uv sync --extra test
PYTHONPATH=src uv run pytest
```

You are set up when the suite passes.

## Connect it to an editor

Add to your editor's MCP configuration:

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

Restart the connection — editors cache the tool list at start-up.

## First use in a project

Call `setup_config()`. It writes `.common-rules-server/config.env` with every
setting explained, detects what it can, installs the commit-message hook, and
writes orchestration guidance where your editor reads it.

Then read `next_steps` in the response. Anything listed there needs an answer it
could not determine — `TEST_COMMAND` usually among them.

Confirm with `get_context()`: `integrity.ok` should be true and `problems`
empty.

## First week

- [ ] Read the [PRD](../product/PRD.md) — what this is for
- [ ] Read the [System Design](../architecture/SYSTEM-DESIGN.md) — how it fits together
- [ ] Read [ADR-001](../architecture/adrs/ADR-001-unified-resource-model.md) — why one format
- [ ] Read the [Development Guide](../engineering/DEVELOPMENT-GUIDE.md) — adding a resource
- [ ] Read the [Workflow](../../template/tracking/WORKFLOW.md) — how work moves


---

← Previous: [Rollback Playbook](../operations/ROLLBACK-PLAYBOOK.md) · Next: [Roadmap](../tracking/ROADMAP.md) →
