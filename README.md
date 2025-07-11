# Common Rules Server

## Overview

This project provides a centralized command-line interface (CLI) that implements the **Model Context Protocol (MCP)** for agentic development. The goal is to manage and provide a common set of rules for AI-assisted IDEs like Cursor, streamlining the process of defining, managing, and applying consistent rule sets across different development environments.

The rules are categorized as:
- **System Rules**: High-priority rules automatically applied in all AI interactions. These are general-purpose rules that apply across all projects.
- **User Rules**: Dynamic, project-specific rules used to refine the generation process, which can be applied manually or automatically.

This tool is designed to work alongside the IDE's native rule system, with a clear precedence order to avoid conflicts.

## Technology Stack

This project uses the following technology stack:

- **Language:** Python 3.11+ (Docker image uses Python 3.12)
- **Core Dependencies:**
  - [typer[all] >= 0.12.3](https://typer.tiangolo.com/) — CLI framework
  - [pydantic >= 2.7.4](https://docs.pydantic.dev/) — Data validation and settings management
  - [mcp >= 1.9.3](https://github.com/modelcontextprotocol/python-sdk) — Model Context Protocol SDK
- **Development Dependencies:**
  - [pytest >= 8.2.2](https://docs.pytest.org/) — Testing framework
  - [pytest-cov >= 5.0.0](https://pytest-cov.readthedocs.io/) — Test coverage reporting
- **Build System:** [Hatchling](https://hatch.pypa.io/) (via `pyproject.toml`)
- **Dependency Management:** [uv](https://github.com/astral-sh/uv) (used in Dockerfile and for local development)
- **Entrypoints & Scripts:**
  - `common-rules` (CLI entrypoint, defined in `pyproject.toml`)
  - `main.py` (manual/local entrypoint)
  - `src/main/python/mcp_server.py` (main MCP server implementation)
- **Packaging:**
  - Source and resources included via Hatch build config
- **Containerization:**
  - Dockerfile provided (uses `python:3.12-slim-bookworm` and `uv` for dependency management)

See `pyproject.toml` and the Dockerfile for full details.

### 7. Triggering MCP Tools from the Terminal

To call tools like `get_user_rules` from the terminal, you must use an MCP-compatible client. The protocol requires a handshake and specific message structure; direct echo/pipe will not work.

## Rule System Architecture

### Rule File Format

- **Only `.md` files are supported** for rules. Each rule file must begin with a strict YAML header containing at least:
  - `description`: Brief summary of the rule's purpose and intent (must clarify that rules are agent/AI guidance, not automation)
  - `type`: The rule's trigger type (e.g., Always, Agent Requested, Auto Attached, Manual)
  - `artifacts`: List of referenced artifact/template files (may be empty)
- **No `.mdc` or legacy formats are supported.**
- The YAML header is followed by the rule's pseudo-code and agent instructions. Output templates are referenced via the `artifacts` field and stored in `artifacts/templates/`.

### Rule Types by Trigger Mechanism

The framework supports four types of rules with different trigger mechanisms:

1. **Always Triggered Rules** (System Rules)
   - Core orchestration and system-level rules that run automatically
   - Includes main orchestrator and general system operations

2. **Manual Triggered Rules**
   - Rules triggered by orchestrator references or specific user requests
   - Includes orchestration, development, and compliance rules

3. **Auto Attached Rules**
   - Rules that automatically trigger based on file types or context

4. **Agentic Rules**
   - Rules that the agent chooses when to use

### Rule Discovery and Artifacts

- The MCP server exposes the following tools for rule and artifact discovery:
  - `get_system_rules`: List all system rules (summary only)
  - `get_user_rules`: List all user rules (summary only)
  - `get_system_rule`: Get the full content of a specific system rule
  - `get_user_rule`: Get the full content of a specific user rule
  - `get_artifact`: Retrieve the content of an artifact file by its key (relative path from artifacts directory)
  - `list_rule_categories`: List all rule categories and their types
- Rules reference their output templates via the `artifacts` field. Templates are stored in `src/common_rules_server/resources/artifacts/templates/`.
- Rules provide structured guidance for agents (human or AI) and do not perform actions automatically.

### Agent/AI Workflow

- Agents use the rule pseudo-code and referenced templates to guide their actions and outputs.
- All output formatting is performed according to the referenced template artifact.
- The system is designed for agent-driven workflows, not direct automation.

### Example Rule File Structure

```
---
description: This rule provides guidance to the agent for ...
type: Agent Requested
artifacts:
  - templates/example_template.md
---

// Pseudocode and agent instructions here
// The output for this rule must be created according to the template_id: templates/example_template.md
```

## Running the MCP Server

The main entrypoint is `src/common_rules_server/mcp_server.py`. When run, it logs the following information:

- Server name and status
- Exposed MCP tools: get_system_rules, get_user_rules, get_system_rule, get_user_rule, list_rule_categories, get_artifact
- Rule and artifact directory locations
- Usage instructions for MCP-compatible clients

Example log output:

```
========================================
  Common Rules MCP Server (Python)
========================================
Server: common-rules-server

MCP server is running.
- Use an MCP-compatible client, IDE, or Cursor to connect.
- Exposes tools: get_system_rules, get_user_rules, get_system_rule, get_user_rule, list_rule_categories, get_artifact
- Place rules in src/common_rules_server/resources/rules/system/ and user/ with subdirectories
- Supports subfolders for better organization

For SDK details: https://github.com/modelcontextprotocol/python-sdk
========================================
```

## Documentation
- [Architecture](ARCHITECTURE.md) - System architecture and design patterns

## Key Features

- **Technology Agnostic**: Rules adapt to any project type by reading from documentation
- **Documentation Driven**: Project-specific behavior based on README.md and ARCHITECTURE.md
- **State Machine Orchestration**: Clear workflow with forced rule sequences
- **Extensible Rule System**: Support for multiple rule types and trigger mechanisms
- **MCP Integration**: Seamless integration with AI-assisted IDEs
- **Docker Support**: Containerized deployment for consistent environments

## Running Tests

You can install test dependencies and run tests using the tools below. All dependencies are managed in `pyproject.toml` under `[project.optional-dependencies]`.

### 1. Using pip (recommended)
```sh
pip install -e ".[test]"
pytest src/test/ -v
```

### 2. Using uv
```sh
uv pip install -e ".[test]"
pytest src/test/ -v
```

### 3. Using hatch (if you want to use hatch environments)
```sh
hatch env create
hatch run pytest src/test/ -v
```

**Note:**
- If you encounter file lock errors on Windows, ensure no process is using the installed package or its scripts before installing.
- All test dependencies are specified in `pyproject.toml` for reproducibility.