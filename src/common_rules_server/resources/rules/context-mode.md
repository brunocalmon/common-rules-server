---
kind: rule
type: Always
name: context-mode
description: Instructs the agent to use the context-mode CLI instead of MCP tools.
self_check:
  - Did I use the CLI commands rather than MCP tool calls?
  - Did I use `context-mode doctor` to verify it is operational?
---

## Context Mode (CLI Proxy)

`context-mode` is installed globally on the system but is NOT registered as an MCP server.
To use `context-mode`'s tools, you MUST execute its CLI via `run_command`.
Available commands include:
- `context-mode execute <command>`: Runs a shell command and compresses output.
- `context-mode execute-file <path>`: Compresses file reading.
- `context-mode index <path>`: Indexes a directory for search.
- `context-mode search <query>`: Semantic search.
- `context-mode insight <query>`: Generates architectural insights.
- `context-mode stats`: Shows index statistics.

Do NOT attempt to use MCP tools like `ctx_execute`, as they are not registered.
Use standard bash commands calling `context-mode` instead.
