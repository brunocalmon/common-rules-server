---
kind: hook
name: context-mode-pretooluse
description: Intercepts tools that output large context, feeding them to context-mode.
event: before-shell
raw_command: context-mode hook {ide} pretooluse
matcher: "run_shell_command|read_file|read_many_files|grep_search|search_file_content|web_fetch|call_mcp_tool"
self_check:
  - Does this intercept only large-output tools, not every command?
  - Does it pass through to context-mode without altering the tool input?
---
