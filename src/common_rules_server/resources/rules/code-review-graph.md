---
kind: rule
type: Always
name: code-review-graph
description: Instructs the agent to use the code-review-graph CLI instead of MCP tools.
---

## Code Review Graph (CLI Proxy)

`code-review-graph` is installed globally but is NOT registered as an MCP server.
You must use its CLI via `run_command` instead of MCP tools.
Available commands:
- `code-review-graph query <query>`: Answers architectural queries using the graph.
- `code-review-graph build`: Rebuilds the graph incrementally.

Do NOT attempt to use MCP tools like `query_graph_tool`.
Use standard bash commands calling `code-review-graph` instead.
