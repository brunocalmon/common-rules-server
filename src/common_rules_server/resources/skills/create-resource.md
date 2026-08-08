---
kind: skill
name: create-resource
description: >-
  Create a new rule, skill, agent, workflow, or loop in the project.
  Use when the user wants to add custom resources.
trigger: user-invoked
relationships:
  output: templates/create-resource.md
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| output | templates/create-resource.md | yes | Creation report |

## Instructions

Guide the user through creating a new resource.

1. Ask: what kind? (rule, skill, agent, workflow, loop)
2. Ask: what name? (kebab-case)
3. Ask: what does it do? (one-line description)
4. Ask: what are its relationships? (comes-from, goes-to, can-invoke)
5. Ask: does it need env placeholders?

Generate the resource file following the unified format. Validate it.
Write to {{RESOURCES_DIR}}/<kind>/<name>.md.

Use the `create_resource` MCP tool to persist it.