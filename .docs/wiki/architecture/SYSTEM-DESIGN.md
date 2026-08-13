[← Wiki Hub](../README.md)

---

# System Design

**Status:** Current
**Last reviewed:** 2026-08-08

## Purpose

Serve orchestration resources to coding agents over MCP, resolve them against
project configuration, and configure the surrounding project so the agent is set
up to use them.

## Context

```
        editor / agent
              │  MCP (stdio)
              ▼
     ┌──────────────────┐
     │   mcp_server     │  5 tools
     └────────┬─────────┘
              │
   ┌──────────┴───────────────────────────────┐
   ▼          ▼            ▼          ▼       ▼
config    resource     git_hook     ide    mcp_installer
service   service      service    service     service
              │
     ┌────────┴────────┐
     ▼                 ▼
 built-in kit    project resources
 (this package)  (RESOURCES_DIR)
```

## Components

| Component | Responsibility | Depends on |
|---|---|---|
| `mcp_server` | Tool surface; constructs services per call | all services |
| `config_service` | Schema, detection, reading and writing config | — |
| `resource_service` | Loading, resolution, gating, override, integrity | config_service, parsing, placeholders |
| `bdd_service` | Gherkin parsing and pagination | — |
| `git_hook_service` | Commit-message filtering | — |
| `ide_service` | Editor detection and guidance placement | — |
| `mcp_installer_service` | Companion detection and proposals | — |
| `util.resource_parsing` | Frontmatter parsing and validation | — |
| `util.placeholders` | Substitution of known config keys | — |

## Key decisions

Services are constructed per call rather than at import. The working directory
and the configuration can both change while the process runs, and a service
captured at import keeps answering with the state at start-up.

Resources are data, not code. Adding a skill means adding a Markdown file; the
server has no table of resource names in it. The one place this shows is gating:
a resource declares the config flag that gates it, so a project can ship a gated
resource without a code change.

`get_context` deliberately withholds bodies. Sending every instruction to
describe what is available would consume the context the call exists to inform.

## Data

| Store | Contents | Lifetime |
|---|---|---|
| Package `resources/` | The built-in kit | Ships with the release |
| `RESOURCES_DIR` | Project resources and overrides | Project lifetime |
| `.common-rules-server/config.env` | Project configuration | Project lifetime; committed |

## Known weaknesses

The catalogue is re-stat'ed on each call to detect changes. Fine at this size;
it would need a watcher at a few thousand resources.

Companion detection cannot construct a launch entry without evidence — see
[FND-013](../tracking/findings/FND-013.md).

## Decisions

Recorded as ADRs, starting with
[ADR-001](adrs/ADR-001-unified-resource-model.md).


---

← Previous: [Product Requirements](../product/PRD.md) · Next: [ADR-001 Unified Resource Model](adrs/ADR-001-unified-resource-model.md) →
