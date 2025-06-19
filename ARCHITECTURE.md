# Common Rules Server Architecture

## Overview
The Common Rules Server is architected for maintainability, extensibility, and compliance. It uses a layered approach, strict boundaries, and proven design patterns to support both human and agentic workflows. The system provides a **general, agnostic framework** for creating rule-based agent instruction sets with proper state machine orchestration.

## Core Architecture Principles

### Rule System Philosophy
**Rules are Agent instructions that tell the Agent where to look and what to check, not implementations.** The system is designed to be:
- **Technology Agnostic**: Rules adapt to any project type by reading from documentation
- **Documentation Driven**: Project-specific behavior based on README.md and ARCHITECTURE.md
- **State Machine Orchestrated**: Clear workflow with forced rule sequences
- **Extensible**: Easy to add new rule types and categories

## Rule File Format

- **Only `.md` files are supported** for rules. Each rule file must begin with a strict YAML header containing at least:
  - `description`: Brief summary of the rule's purpose and intent (must clarify that rules are agent/AI guidance, not automation)
  - `type`: The rule's trigger type (e.g., Always, Agent Requested, Auto Attached, Manual)
  - `artifacts`: List of referenced artifact/template files (may be empty)
- **No `.mdc` or legacy formats are supported.**
- The YAML header is followed by the rule's pseudo-code and agent instructions. Output templates are referenced via the `artifacts` field and stored in `artifacts/templates/`.

## Project Structure

```
common-rules-server/
├── ARCHITECTURE.md
├── Dockerfile
├── README.md
├── pyproject.toml
├── src/
│   ├── common_rules_server/
│   │   ├── __init__.py
│   │   ├── __main__.py
│   │   ├── domain/
│   │   │   ├── __init__.py
│   │   │   └── rule.py
│   │   ├── mcp_server.py
│   │   ├── resources/
│   │   │   ├── __init__.py
│   │   │   ├── artifacts/
│   │   │   │   └── code_style/
│   │   │   │       ├── checkstyle.xml
│   │   │   │       └── suppressions.xml
│   │   │   └── rules/
│   │   │       ├── __init__.py
│   │   │       ├── system/
│   │   │       └── user/
│   │   ├── service/
│   │   │   ├── __init__.py
│   │   │   └── rule_service.py
│   │   └── util/
│   │       ├── __init__.py
│   │       └── rule_parsing.py
│   └── test/
│       ├── test_integration_mcp_server.py
│       └── test_rule_factory.py
```

## Rule Types and Discovery

- **System Rules**: High-priority rules automatically applied in all AI interactions. These are general-purpose rules that apply across all projects.
- **User Rules**: Dynamic, project-specific rules used to refine the generation process, which can be applied manually or automatically.
- **Rule Types**: Always, Agent Requested, Auto Attached, Manual (specified in YAML header)
- **Rule Discovery**: The MCP server exposes tools for rule and artifact discovery:
  - `get_system_rules`, `get_user_rules` (summary only)
  - `get_system_rule`, `get_user_rule` (full content)
  - `get_artifact` (artifact content)
  - `list_rule_categories` (category/type listing)

## Output Templates and Artifacts

- Rules reference their output templates via the `artifacts` field in the YAML header.
- Templates are stored in `src/common_rules_server/resources/artifacts/templates/`.
- All output formatting is performed according to the referenced template artifact.
- Rules provide structured guidance for agents (human or AI) and do not perform actions automatically.

## Agent/AI Workflow

- Agents use the rule pseudo-code and referenced templates to guide their actions and outputs.
- The system is designed for agent-driven workflows, not direct automation.

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

## Design Patterns and Extensibility

- **Factory Pattern**: RuleFactory instantiates the correct rule type based on parsed headers
- **Service Pattern**: RuleService encapsulates business logic and rule management
- **Layered Architecture**: Interface, service, and domain layers are strictly separated
- **SOLID Principles**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **Extensibility**: New rule types, tools, and protocols can be added with minimal changes

## Compliance and Quality Assurance

- **Documentation Status Check**: Rules verify README.md and ARCHITECTURE.md existence
- **Project-Specific Adaptation**: Rules adapt based on documented architecture
- **User Guidance**: Clear instructions for handling missing documentation
- **Testing Strategy**: Unit, integration, and protocol compliance testing
- **Code Quality**: Type hints, documentation, robust error handling

## References

- [README.md](README.md) - Project overview and usage instructions
