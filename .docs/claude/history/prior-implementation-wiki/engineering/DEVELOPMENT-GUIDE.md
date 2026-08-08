# Development Guide

[🏠 Wiki Hub](../../README.md)

This guide covers how to develop, test, and run the Common Rules MCP server.

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

## Testing Locally (Antigravity IDE)

If you are developing locally and want to test the server directly in Antigravity without waiting for a Docker Hub deployment, you can configure a temporary local MCP connection.

1. Open your Antigravity MCP configuration file, typically located at:
   `/home/bcalmon/distrobox/dev-env/.gemini/config/mcp_config.json`

2. Add a new server definition pointing to your local repository. For example:
   ```json
   "common-rules-server-local-test": {
     "command": "uv",
     "args": [
       "--directory",
       "/home/bcalmon/Projects/common-rules-server",
       "run",
       "common-rules"
     ]
   }
   ```

3. Antigravity will automatically hot-reload the configuration. You can then invoke the server's tools (e.g., `get_context`) using `call_mcp_tool` with `ServerName` set to `common-rules-server-local-test`.

4. **Clean up:** Once you have verified your changes, remove the temporary configuration block to ensure you return to the global, stable MCP server installed via Ansible.
