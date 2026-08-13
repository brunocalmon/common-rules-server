# Agent BDD Testing Framework

[🏠 Wiki Hub](../README.md)

## Overview

The Agent BDD framework is a native testing system built into the Common Rules MCP Server. It allows an AI agent to execute behavioral tests written in Gherkin syntax by directly calling MCP tools — no Cucumber runtime, no test framework, no mocks.

**The agent IS the test runner.**

## How It Works

```
┌──────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│  agent_bdd.feature│────▶│  get_bdd_scenario  │────▶│  Agent executes   │
│  (Gherkin file)   │     │  (MCP tool, paged) │     │  Given/When/Then  │
└──────────────────┘     └───────────────────┘     └──────────────────┘
                                                            │
                                                            ▼
                                                   ┌──────────────────┐
                                                   │  Pass/Fail Report │
                                                   └──────────────────┘
```

1. A `.feature` file (`agent_bdd.feature`) is placed in the project root.
2. The MCP tool `get_bdd_scenario(page=N)` reads the file and returns **one scenario at a time**.
3. The agent reads the Given/When/Then steps, executes the `When` by calling the appropriate MCP tool, and validates `Then` assertions against the actual response.
4. The agent loops through all pages until `has_next` is false.

## The Gherkin File

The file uses standard [Cucumber Gherkin syntax](https://cucumber.io/docs/gherkin/reference/):

```gherkin
Feature: get_context — Progressive Disclosure

  Scenario: Returns all built-in resources with required metadata fields
    Given the MCP server "common-rules-server-local-test" is running
    And no user overrides exist in .common-rules/
    When I call get_context with no arguments
    Then the response is a JSON list
    And every item in the list contains the key "kind"
    And every item in the list contains the key "name"
```

### Writing Conventions

| Rule | Why |
|------|-----|
| Use exact, real values in Then steps | No mocks, no approximations |
| One Feature per tool/endpoint | Logical grouping |
| 3-8 steps per Scenario | Keeps scenarios focused |
| Include cleanup steps for side effects | `create_resource` creates files that should be deleted |
| Use Doc Strings for large payloads | Triple-quoted blocks inside steps |

## MCP Resources

The framework ships with these built-in resources:

| Kind | Name | Purpose |
|------|------|---------|
| skill | `/bdd-generate` | Generate `agent_bdd.feature` using `/grill-me` |
| skill | `/bdd-run` | Execute all scenarios against the live MCP |
| skill | `/bdd-review` | Review `.feature` file for coverage gaps |
| agent | `qa-engineer` | QA persona that runs and reviews BDD tests |
| workflow | `bdd-cycle` | Full lifecycle: Generate → Run → Review → Fix → Regression |

## Running Tests Locally

### Prerequisites
The MCP server must be configured locally. See [Development Guide](DEVELOPMENT-GUIDE.md) for how to add `common-rules-server-local-test` to your Antigravity config.

### Execution
1. Ask the agent to invoke `/bdd-run`
2. The agent will call `get_bdd_scenario(page=1)`, execute the scenario, then `page=2`, etc.
3. A pass/fail report is produced using `templates/bdd-run.md`

### Full Cycle
Ask the agent to invoke the `bdd-cycle` workflow for the complete lifecycle including generation, execution, review, and regression testing.

## API Reference

### `get_bdd_scenario(page: int = 1) -> dict`

Returns one Gherkin scenario at a time from `agent_bdd.feature`.

**Request:**
```json
{ "page": 1 }
```

**Response (success):**
```json
{
  "scenario": {
    "name": "Returns all built-in resources",
    "body": "Scenario: Returns all built-in resources\n    Given ..."
  },
  "page": 1,
  "total_pages": 14,
  "has_next": true
}
```

**Response (out of range):**
```json
{
  "error": "Page 999 is out of range. Valid range: 1-14.",
  "page": 999,
  "total_pages": 14,
  "has_next": false
}
```

**Response (no file):**
```json
{
  "error": "agent_bdd.feature not found in project root.",
  "page": 1,
  "total_pages": 0,
  "has_next": false
}
```
