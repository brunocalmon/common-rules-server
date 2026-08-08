# Common Rules MCP Server

Welcome to the **Common Rules Server**, a powerful development orchestration MCP (Model Context Protocol).

This server has evolved from a simple static rules engine into a **fully dynamic, context-aware orchestrator** that exposes resources (Rules, Skills, Agents, Workflows, and Loops) as first-class primitives to AI agents.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/brunocalmon/common-rules-server.git
cd common-rules-server

# Install dependencies using uv
uv sync

# Run the test suite
PYTHONPATH=src uv run pytest
```

## How It Works

The server implements the Model Context Protocol (MCP) using the `FastMCP` framework. It exposes 4 primary tools to the AI agent:
1. `get_context()`: Progressive disclosure of the environment and available resources.
2. `get_resource()`: Returns the full parsed YAML frontmatter and Markdown body of a specific rule, skill, workflow, agent, or loop.
3. `create_resource()`: Allows the AI agent to dynamically write new skills into the user's `$PROJECT_ROOT/.common-rules/` directory.
4. `setup_config()`: Automatically discovers the project's build system and prepares a `.common-rules-mcp.env` file.

## Unified Resource Model

We have completely migrated to a unified Resource Model using YAML Frontmatter. Instead of hardcoding behavior into Python, all orchestration logic lives in simple Markdown files.

For an in-depth view of the architecture, read [ARCHITECTURE.md](ARCHITECTURE.md) and our internal wiki at [`.docs/antigravity/`](.docs/antigravity/).