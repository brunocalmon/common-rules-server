---
kind: skill
name: onboard
description: >-
  First-time MCP setup and project configuration.
  Use when .common-rules-mcp.env does not exist or user asks for setup.
trigger: model-invoked
relationships:
  output: templates/onboard.md
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| output | templates/onboard.md | yes | Setup report |

## Instructions

Run a lightweight onboarding flow.

1. Check if `.common-rules-mcp.env` exists. If not, invoke `setup_config()`.
2. Auto-detect what you can: build system, language, test command.
3. Ask the user to confirm detected values and fill in what's missing.
4. Ask which optional features to enable (notebooks, logbook, compliance, deviation).
5. Summarize the configuration and confirm.

Ask one question at a time. Do not overwhelm.