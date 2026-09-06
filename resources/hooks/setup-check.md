---
kind: hook
name: setup-check
description: At session start, notices when this project has never completed setup and suggests running it.
event: session-start
self_check:
  - Does this stay silent when setup already completed, instead of nagging every session?
  - Does it catch a partial setup (hooks installed, framework missing) the same as a project that was never touched?
---

## Why this exists

A project can end up with hooks installed but nothing else — found running
setup through the MCP tool instead of the terminal, before the two were
brought to parity: `.claude/settings.json` had all seven hooks, yet neither
the Specsfy framework nor the external skill sets were ever installed,
because the tool that wrote the hooks never asked for them. Nothing told the
person; the gap only surfaced by comparing two separate setup runs by hand.

This hook is the check that replaces that manual comparison: at the start of
every session, it looks for the two markers a real setup leaves behind and
says something the moment either is missing, instead of assuming silence
means everything is fine.

## Script

```sh
if [ ! -f "$PROJECT_DIR/.common-rules/install.json" ] || [ ! -d "$PROJECT_DIR/.specsfy" ]; then
  cat <<'EOF'
common-rules: this project hasn't completed setup yet (missing .common-rules/install.json or .specsfy/). Run the `setup` tool (or `common-rules setup` from a terminal) before relying on its hooks, skills or the Specsfy framework — some of what's configured so far may be partial.
EOF
fi
```
