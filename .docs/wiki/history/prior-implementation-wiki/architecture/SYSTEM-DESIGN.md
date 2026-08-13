# Architecture of the Common Rules Server

The Common Rules Server operates as an orchestrator using the Model Context Protocol (MCP). It abandons hardcoded rules in favor of a dynamic, declarative system called the **Unified Resource Model**.

## 1. Unified Resource Model

Every behavior in the system is defined by a Markdown file containing YAML frontmatter. These files are categorized by their `kind`:

- **Rule (`rule`)**: Behavioral primitives (e.g., "always check docs before coding").
- **Skill (`skill`)**: Invocable actions with defined steps (e.g., `/tdd`, `/grill-me`).
- **Agent (`agent`)**: Personas and toolsets for subagents (e.g., `reviewer`).
- **Workflow (`workflow`)**: Ordered sequences of skills (e.g., `feature-dev`).
- **Loop (`loop`)**: Workflows with recurrence triggers (e.g., `pr-babysit`).

### Anatomy of a Resource

```markdown
---
kind: skill
name: tdd
description: "Red-green-refactor loop for test-driven development."
trigger: model-invoked
relationships:
  comes-from:
    - target: /dev-process
  goes-to:
    - target: /verify
      required: true
  output: templates/tdd.md
env:
  requires: [TEST_COMMAND]
---

## Instructions
1. **Red.** Write a failing test using {{TEST_COMMAND}}.
2. **Green.** Write minimum code to pass.
3. **Repeat.** Next behavior.
```

## 2. Config System

Variables like `{{TEST_COMMAND}}` are resolved via a configuration system.
The system looks for a `.common-rules-mcp.env` file in the project root. If missing, the agent can invoke `setup_config()` to auto-detect values based on files like `pyproject.toml` or `package.json`.

## 3. API Contract

The Python core is intentionally thin, acting only as a parser and distributor of the markdown resources via FastMCP:

1. **`get_context()`**: Returns the entire resource map (names, descriptions, relationships) without the bodies. This saves tokens and provides the agent with a holistic view of what it can do.
2. **`get_resource(kind, name)`**: Returns the fully resolved body of the requested resource.
3. **`create_resource(kind, name, description, body)`**: Saves new YAML-frontmatter markdown files directly to the user's project folder (`.common-rules/`), enabling self-improving agents.
4. **`setup_config()`**: Detects and bootstraps the environment.

## 4. Resource Loading Priority

Resources are loaded and overridden in the following order:
1. `$PROJECT_ROOT/.common-rules/` (User's project repository)
2. `src/common_rules_server/resources/` (Built-in standard library)
