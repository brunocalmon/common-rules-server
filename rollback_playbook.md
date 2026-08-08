# Rollback Playbook v2: Common Rules MCP — Full Redesign

> Transform from a pseudo-code rules server into a **development orchestration MCP**
> with rules, skills, agents, workflows, and loops as first-class resources.

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Resource Model](#2-resource-model)
3. [Unified Resource Format](#3-unified-resource-format)
4. [API Contract](#4-api-contract)
5. [Default Kit](#5-default-kit)
6. [Configuration System](#6-configuration-system)
7. [Directory Structure](#7-directory-structure)
8. [Execution Plan](#8-execution-plan)

---

## 1. Design Principles

| Principle | Meaning |
|-----------|---------|
| **Natural language only** | No pseudo-code, no variables, no function calls. Imperative prose. |
| **Self-aware resources** | Every resource knows where it comes from, where it goes, and what it can invoke. |
| **Progressive disclosure** | API returns names + descriptions first; full content only when requested. Saves tokens. |
| **One format, many kinds** | All resources share one YAML frontmatter schema. A `kind` field differentiates them. |
| **Placeholders, not hardcodes** | All configurable values use `{{PLACEHOLDER}}` syntax. Values come from `.common-rules-mcp.env`. |
| **Tool-agnostic** | Never references Cursor, Claude, Antigravity, or any IDE by name. Works everywhere. |
| **Predictable outputs** | Every resource that produces output links to a template. Agent always knows the expected format. |
| **Rich API, few calls** | One `get_context()` call gives the agent the full map. One `get_resource()` gives the content. |

### Inspirations and what we took from each

| Source | What we took | What we did NOT take |
|--------|-------------|---------------------|
| **mattpocock/skills** | Clean natural language format. `/name` cross-references. Composable skills. Grilling as requirements discipline. Wayfinder for large planning. Research as background agent pattern. Tracer-bullet tickets. Domain modeling as active glossary. | Issue tracker integration (too opinionated). Specific ticket formats (we template them). |
| **Cursor built-in skills** | `create-*` pattern for dynamic resource creation. Onboarding flow. Babysit loop pattern. Review delegation to subagents. Progressive disclosure of skill content. | Cursor-specific settings management. IDE-specific UI integration. |
| **Antigravity customizations** | Plugin bundling concept. Hierarchical discovery (project > global > built-in). JSON config for explicit registration. Hooks lifecycle model. MCP as tool integration. | Google-specific infrastructure. Sidecar concept. |
| **context-mode** | Token-efficient responses. Return only what's needed. Batch operations to reduce call count. | Session-specific caching (MCP is stateless). |

---

## 2. Resource Model

### Conceptual hierarchy

```
rules       (behavioral primitives — always-on or triggered instructions)
  └─ skills     (composable actions — invoke rules and other skills)
       └─ workflows  (orchestrated sequences of skills)
            └─ loops       (workflows with recurrence/trigger)
agents      (orthogonal — define WHO executes, not WHAT)
```

### Kind definitions

| Kind | Purpose | Invocation | Example |
|------|---------|------------|---------|
| `rule` | Behavioral instruction the agent follows | Always-on or agent-requested | "Always check docs before coding" |
| `skill` | Invocable action with defined steps | User invokes with `/name` or agent decides | `/tdd`, `/grill-me`, `/verify` |
| `agent` | Persona + toolset + constraints | Spawned as subagent | `reviewer`, `researcher` |
| `workflow` | Ordered sequence of skills/rules | User invokes or orchestrator suggests | `feature-dev`, `bug-fix` |
| `loop` | Workflow with recurrence | User sets up or agent suggests | `pr-babysit`, `daily-review` |

### Composition rules

- A **rule** references no other rules (it's a primitive).
- A **skill** can invoke rules and other skills via `/name`.
- A **workflow** is an ordered list of skills, with optional gates between phases.
- A **loop** wraps a workflow or skill with a schedule/trigger.
- An **agent** declares which rules/skills it uses, independently of workflows.

---

## 3. Unified Resource Format

Every resource file follows this exact structure:

```markdown
---
kind: rule | skill | agent | workflow | loop
name: kebab-case-id
description: >-
  One-line summary. Written in third person for model-invocation:
  "Use when the user wants to..." or "Validates that..."
type: Always | Agent Requested | Auto Attached    # rules only
trigger: user-invoked | model-invoked              # skills only
relationships:
  comes-from:
    - target: /general
      required: true
      note: Must run health check first
  goes-to:
    - target: /verify
      required: true
  can-invoke:
    - target: /tdd
      required: false
      note: Only if project has tests
    - target: /grill-me
      required: false
      note: If user wants requirements stress-test
  output: templates/dev-process.md
env:
  requires: [TEST_COMMAND]
  optional: [COVERAGE_COMMAND, COVERAGE_THRESHOLD]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /general | yes | Must run health check first |
| goes-to | /verify | yes | Always verify after development |
| can-invoke | /tdd | no | Only if project has tests |
| can-invoke | /grill-me | no | If user wants requirements stress-test |
| output | templates/dev-process.md | yes | Report format |

## Instructions

Natural language instructions here. Imperative voice. Direct. Minimal.

Use {{PLACEHOLDER}} for configurable values.
Reference other resources with /name syntax.
```

### Format rules

| Rule | Applies to |
|------|-----------|
| `kind` + `name` + `description` required for ALL kinds | All |
| `type` field only for rules | Rules |
| `trigger` field only for skills | Skills |
| `relationships` in YAML for MCP parsing + markdown table in body for agent reading | All |
| `env.requires` lists placeholders that MUST be set | All |
| `env.optional` lists placeholders that MAY be set | All |
| Body ≤ 50 lines for rules/skills, ≤ 80 for workflows/agents | All |
| No pseudo-code, no variables, no function calls | All |
| `{{PLACEHOLDER}}` for all configurable values | All |
| `/name` for cross-references | All |

### Kind-specific fields

**Rules** — no extra fields beyond `type`.

**Skills:**
```yaml
trigger: user-invoked    # only activates via /name
trigger: model-invoked   # agent can decide to activate based on description
```

**Agents:**
```yaml
persona: One-line persona description
tools: [list, of, tools, this, agent, uses]
constraints: [list, of, behavioral, constraints]
```

**Workflows:**
```yaml
phases:
  - name: Plan
    skills: [/grill-me, /architecture-compliance]
    gate: User confirms plan before proceeding
  - name: Develop
    skills: [/dev-process, /tdd]
  - name: Verify
    skills: [/verify, /test-cycle]
    gate: All checks must pass
```

**Loops:**
```yaml
schedule: "on-demand"     # user triggers manually
schedule: "after-push"    # runs after git push
schedule: "interval:5m"   # runs every 5 minutes
wraps: /workflow-name     # or /skill-name
```

---

## 4. API Contract

### Tool 1: `get_context()`

Returns the complete resource map with metadata — NO body content. One call gives the agent the full picture.

```python
@mcp.tool()
def get_context() -> dict:
    """
    Returns the full orchestration context: resolved config,
    all available resources (rules, skills, agents, workflows, loops)
    with their metadata and relationships, and env status.
    """
```

**Response shape:**

```json
{
  "config": {
    "PROJECT_NAME": "my-app",
    "BUILD_COMMAND": "uv run pytest",
    "TEST_COMMAND": "uv run pytest",
    "COVERAGE_THRESHOLD": "80",
    "ENABLE_NOTEBOOKS": "false"
  },
  "env_status": {
    "file_exists": true,
    "file_path": "/project/.common-rules-mcp.env",
    "missing_required": [],
    "missing_optional": ["COVERAGE_COMMAND", "LINT_COMMAND"],
    "auto_detected": {
      "BUILD_SYSTEM": "python",
      "PROJECT_LANGUAGE": "python"
    }
  },
  "resources": [
    {
      "kind": "rule",
      "name": "general",
      "description": "Quick workspace health check — docs, git, build status.",
      "type": "Always",
      "relationships": {
        "goes_to": [{"target": "/orchestrator", "required": true}],
        "output": "templates/general.md"
      },
      "env": {"requires": [], "optional": ["BUILD_COMMAND"]}
    },
    {
      "kind": "skill",
      "name": "tdd",
      "description": "Red-green-refactor loop for test-driven development.",
      "trigger": "model-invoked",
      "relationships": {
        "comes_from": [{"target": "/dev-process", "required": false}],
        "goes_to": [{"target": "/verify", "required": true}],
        "can_invoke": [{"target": "/grill-me", "required": false}],
        "output": "templates/tdd.md"
      },
      "env": {"requires": ["TEST_COMMAND"], "optional": []}
    }
  ],
  "resource_counts": {
    "rule": 2,
    "skill": 12,
    "agent": 3,
    "workflow": 3,
    "loop": 1
  },
  "active_optional": ["notebook", "deviation"],
  "project_overrides_count": 0
}
```

### Tool 2: `get_resource(kind, name)`

Returns the full content of a specific resource — body text, resolved placeholders, and template content.

```python
@mcp.tool()
def get_resource(kind: str, name: str) -> dict:
    """
    Returns the full content of a resource: parsed frontmatter,
    body with {{placeholders}} resolved, and template content.
    """
```

**Response shape:**

```json
{
  "kind": "skill",
  "name": "tdd",
  "description": "Red-green-refactor loop for test-driven development.",
  "trigger": "model-invoked",
  "relationships": {
    "comes_from": [{"target": "/dev-process", "required": false}],
    "goes_to": [{"target": "/verify", "required": true}],
    "output": "templates/tdd.md"
  },
  "body": "Work in vertical slices: one test → one implementation → repeat.\n\n## The loop\n\n1. **Red.** Write a failing test...",
  "template": "# TDD Report\n\n| Phase | Status | Details |\n...",
  "resolved_env": {
    "TEST_COMMAND": "uv run pytest"
  },
  "unresolved_env": []
}
```

### Tool 3: `create_resource(kind, name, description, body)`

Creates a new resource in the project's resource directory. Validates format. Never modifies the MCP repo.

```python
@mcp.tool()
def create_resource(kind: str, name: str, description: str, body: str, extra_fields: dict = None) -> dict:
    """
    Creates a new resource in $RESOURCES_DIR/<kind>/<name>.md.
    Validates against the unified format. Returns the created file path.
    """
```

**Response shape:**

```json
{
  "created": true,
  "path": ".common-rules/skills/my-custom-skill.md",
  "validation": {"valid": true, "warnings": []}
}
```

### Tool 4: `setup_config()`

Generates or updates `.common-rules-mcp.env` with auto-detection and explanations.

```python
@mcp.tool()
def setup_config() -> dict:
    """
    Auto-detects project settings, generates .common-rules-mcp.env
    with all placeholders and their descriptions. Fills detected values.
    Returns the config and what was auto-detected.
    """
```

---

## 5. Default Kit

### 5.1 System Rules (Always Applied)

#### `general` — Workspace Health Check

```markdown
---
kind: rule
name: general
description: >-
  Quick workspace health check — docs, git, build status.
  Applied automatically at the start of every session.
type: Always
relationships:
  goes-to:
    - target: /orchestrator
      required: true
  output: templates/general.md
env:
  optional: [README_PATH, ARCHITECTURE_PATH, BUILD_COMMAND]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| goes-to | /orchestrator | yes | Feeds into workflow selection |
| output | templates/general.md | yes | Health check report |

## Instructions

Run a workspace health check and report status.

**Documentation.** Check if {{README_PATH}} and {{ARCHITECTURE_PATH}} exist.
If both exist, read them to understand the project. If either is missing, note
it — do not assume anything about the project.

**Git.** Run `git status --porcelain`. If uncommitted changes exist, remind
the user.

**Build system.** If {{BUILD_COMMAND}} is set, note it. Otherwise, detect from
project files (package.json, pyproject.toml, build.gradle, pom.xml, Cargo.toml)
and read the build command from documentation. If undetermined, ask.
```

#### `orchestrator` — Default Workflow Guide

```markdown
---
kind: rule
name: orchestrator
description: >-
  Default development workflow — a lightweight guide, not a rigid pipeline.
  Suggests which skills to invoke based on the task shape.
type: Always
relationships:
  comes-from:
    - target: /general
      required: true
  can-invoke:
    - target: /grill-me
      required: false
      note: Stress-test requirements before starting
    - target: /dev-process
      required: false
    - target: /verify
      required: false
    - target: /review
      required: false
  output: templates/orchestrator.md
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /general | yes | Health check runs first |
| can-invoke | /grill-me | no | Stress-test requirements |
| can-invoke | /dev-process | no | Development workflow |
| can-invoke | /verify | no | Build/test/lint verification |
| can-invoke | /review | no | Code review |
| output | templates/orchestrator.md | yes | Workflow summary |

## Instructions

After /general completes, suggest the appropriate workflow based on task shape.

| Task shape | Suggested flow | Key skills |
|-----------|---------------|------------|
| New feature | Plan → Grill → Develop → Test → Verify → Review | /grill-me, /dev-process, /tdd, /verify, /review |
| Bug fix | Diagnose → Fix → Test → Verify | /diagnose, /dev-process, /verify |
| Docs change | Assess → Write → Review | /docs, /review |
| Refactor | Plan → Develop → Verify → Review | /architecture-compliance, /dev-process, /verify, /review |
| Exploration | Research → Grill → Spec | /research, /grill-me, /to-spec |

Self-check before proceeding:
- Were requirements gathered? If not and the task is non-trivial, suggest /grill-me.
- Is architecture documented? If not, suggest /docs first.
- Does the user want this flow or a different one? Ask if unsure.

The orchestrator does not enforce order. It provides structure. Use judgment.
```

---

### 5.2 Core Skills

#### `/grill-me` — Requirements Stress-Test

```markdown
---
kind: skill
name: grill-me
description: >-
  Relentless interview to stress-test a plan, decision, or idea.
  Use when the user wants to validate requirements, or before starting
  non-trivial development work.
trigger: model-invoked
relationships:
  goes-to:
    - target: /to-spec
      required: false
      note: After grilling, may produce a spec
    - target: /dev-process
      required: false
      note: After grilling, may proceed to development
  output: templates/grill-me.md
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| goes-to | /to-spec | no | Produce spec after grilling |
| goes-to | /dev-process | no | Proceed to development |
| output | templates/grill-me.md | yes | Grilling summary |

## Instructions

Interview the user relentlessly until reaching a shared understanding.
Map this as a **decision tree**: every decision branches into decisions
that hang off it.

Work in **rounds**. The **frontier** is every decision whose prerequisites
are settled — the questions askable NOW. Ask the whole frontier in one round.
Number each question and give a recommended answer. Wait for user answers
before the next round.

Format each question:

```
Q1 — <question title>: <question body>
Recommendation: <your recommended answer>
```

Finding facts is YOUR job, not the user's. When a question needs a fact
from the codebase or environment, look it up — don't ask the user for
anything you could find yourself.

The session is done when the frontier is empty: every branch visited,
nothing left silently assumed.
```

#### `/dev-process` — Development Workflow

```markdown
---
kind: skill
name: dev-process
description: >-
  Development workflow — docs check, implementation, verification.
  Use when the user wants to implement a feature or fix.
trigger: model-invoked
relationships:
  comes-from:
    - target: /grill-me
      required: false
      note: Requirements should be grilled first for non-trivial work
    - target: /orchestrator
      required: false
  goes-to:
    - target: /verify
      required: true
  can-invoke:
    - target: /tdd
      required: false
      note: If project has tests
    - target: /docs
      required: false
      note: If behavior changed
  output: templates/dev-process.md
env:
  optional: [README_PATH, ARCHITECTURE_PATH]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /grill-me | no | Requirements grilling |
| comes-from | /orchestrator | no | Default workflow |
| goes-to | /verify | yes | Always verify after dev |
| can-invoke | /tdd | no | If project has tests |
| can-invoke | /docs | no | If behavior changed |
| output | templates/dev-process.md | yes | Dev report |

## Instructions

Before writing code, confirm:

1. {{README_PATH}} and {{ARCHITECTURE_PATH}} exist and describe the dev workflow.
2. If either is missing or unclear, ask — do not assume.

Follow the documented development process. If the project uses TDD, invoke /tdd.
If not, implement directly and then invoke /verify.

When done, check if documentation needs updating. If the change altered behavior,
public API, or architecture, invoke /docs.

Self-check: Were requirements gathered? If this is non-trivial work and no
grilling was done, flag it to the user and offer /grill-me.
```

#### `/tdd` — Test-Driven Development

```markdown
---
kind: skill
name: tdd
description: >-
  Red-green-refactor loop for test-driven development.
  Use when the project has tests and the user wants TDD discipline.
trigger: model-invoked
relationships:
  comes-from:
    - target: /dev-process
      required: false
  goes-to:
    - target: /verify
      required: true
  output: templates/tdd.md
env:
  requires: [TEST_COMMAND]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /dev-process | no | Part of dev workflow |
| goes-to | /verify | yes | Verify after TDD cycle |
| output | templates/tdd.md | yes | TDD cycle report |

## Instructions

Work in vertical slices: one test, one implementation, repeat.

**The loop:**
1. **Red.** Write a failing test. Run {{TEST_COMMAND}} to confirm it fails.
2. **Green.** Write minimum code to pass. Run {{TEST_COMMAND}} to confirm.
3. **Repeat.** Next behavior. Do not refactor inside the loop.

Refactoring belongs to the review stage, not the red-green cycle.

**What makes a good test:**
- Tests verify behavior through public interfaces, not implementation details.
- A good test reads like a specification.
- Expected values come from an independent source of truth — never recomputed
  the way the code does.

**Anti-patterns:**
- Implementation-coupled: mocking internals, testing private methods.
- Tautological: assertion recomputes expected value same way code does.
- Horizontal slicing: all tests first, then all implementation.

If {{TEST_COMMAND}} is not set, detect from project files and ask user.
```

#### `/verify` — Build, Test, Lint

```markdown
---
kind: skill
name: verify
description: >-
  Build, test, and lint the project. Confirm nothing is broken.
  Use after any code change.
trigger: model-invoked
relationships:
  comes-from:
    - target: /dev-process
      required: false
    - target: /tdd
      required: false
  goes-to:
    - target: /review
      required: false
  output: templates/verify.md
env:
  optional: [BUILD_COMMAND, TEST_COMMAND, LINT_COMMAND]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /dev-process | no | After development |
| comes-from | /tdd | no | After TDD cycle |
| goes-to | /review | no | Review after verification |
| output | templates/verify.md | yes | Verification report |

## Instructions

Run these checks in order. Stop on first failure.

1. **Build.** Run {{BUILD_COMMAND}}. If not set, detect or ask.
2. **Test.** Run {{TEST_COMMAND}}. Report pass/fail count.
3. **Lint.** If {{LINT_COMMAND}} is set, run it. Report violations.

If all pass, report success. If any fail, report errors and suggest fixes.
```

#### `/test-cycle` — Coverage Analysis

```markdown
---
kind: skill
name: test-cycle
description: >-
  Run tests, analyze coverage, identify gaps.
  Use when coverage analysis is needed.
trigger: user-invoked
relationships:
  comes-from:
    - target: /verify
      required: false
  output: templates/test-cycle.md
env:
  requires: [TEST_COMMAND]
  optional: [COVERAGE_COMMAND, COVERAGE_THRESHOLD]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /verify | no | Deeper analysis after verification |
| output | templates/test-cycle.md | yes | Coverage report |

## Instructions

1. Run {{TEST_COMMAND}}. If it fails, report errors and stop.
2. If {{COVERAGE_COMMAND}} is set, run it and report coverage.
3. If coverage is below {{COVERAGE_THRESHOLD}} (default: 80%), identify gaps.
4. For each gap, suggest a test. Do not write tests automatically — confirm first.

If commands are not set, read from {{README_PATH}} or ask.
```

#### `/docs` — Documentation Management

```markdown
---
kind: skill
name: docs
description: >-
  Review, create, or update project documentation.
  Use after code changes that alter behavior, or when docs are missing.
trigger: model-invoked
relationships:
  can-invoke:
    - target: /docs-workflow
      required: false
      note: For large documentation efforts
  output: templates/docs.md
env:
  optional: [README_PATH, ARCHITECTURE_PATH, DOCS_DIR]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| can-invoke | /docs-workflow | no | For large doc efforts |
| output | templates/docs.md | yes | Documentation report |

## Instructions

**Review.** Check {{README_PATH}} and {{ARCHITECTURE_PATH}} exist and are accurate.
- {{README_PATH}}: project overview, setup, usage, dev workflow.
- {{ARCHITECTURE_PATH}}: structure, patterns, modules, build system.
Flag anything outdated. Do not invent content — ask.

**Update.** After code change, check if it altered:
- Public API or behavior → update {{README_PATH}}.
- Architecture or module boundaries → update {{ARCHITECTURE_PATH}}.
- Neither → no doc update needed.

**Create.** If docs are missing, help the user create them by asking targeted
questions. Do not generate from assumptions.
```

#### `/architecture-compliance` — Structure Validation

```markdown
---
kind: skill
name: architecture-compliance
description: >-
  Validate that implementation matches documented architecture.
  Use before major changes or as part of planning.
trigger: model-invoked
relationships:
  comes-from:
    - target: /orchestrator
      required: false
  output: templates/architecture-compliance.md
env:
  optional: [ARCHITECTURE_PATH]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /orchestrator | no | Part of planning phase |
| output | templates/architecture-compliance.md | yes | Compliance report |

## Instructions

Read {{ARCHITECTURE_PATH}} and compare against the actual codebase.

| Dimension | What to compare |
|-----------|----------------|
| Project structure | Documented layout vs actual `find` output |
| Patterns | Documented patterns vs actual organization |
| Module responsibilities | Documented boundaries vs actual dependencies |
| Build config | Documented build system vs actual files |

For each: if compliant, note it. If not, describe the gap and recommend fixing
the code OR updating the docs.

If {{ARCHITECTURE_PATH}} does not exist, stop and ask the user to create it.
```

#### `/research` — Background Investigation

```markdown
---
kind: skill
name: research
description: >-
  Investigate a question against primary sources and capture findings.
  Use when the user wants a topic researched or docs gathered.
trigger: model-invoked
relationships:
  goes-to:
    - target: /grill-me
      required: false
      note: Research findings feed into grilling
  output: templates/research.md
env:
  optional: [DOCS_DIR]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| goes-to | /grill-me | no | Research feeds grilling |
| output | templates/research.md | yes | Research report |

## Instructions

Spin up a background agent to do the research.

The agent's job:
1. Investigate against **primary sources** — official docs, source code, specs.
   Follow every claim back to the source that owns it.
2. Write findings to a Markdown file, citing each claim's source.
3. Save where the repo keeps such notes. If no convention exists, use
   {{DOCS_DIR}}/research/.
```

#### `/diagnose` — Bug Diagnosis

```markdown
---
kind: skill
name: diagnose
description: >-
  Structured diagnosis loop for hard bugs and performance regressions.
  Use when the user reports something broken, failing, or slow.
trigger: model-invoked
relationships:
  goes-to:
    - target: /dev-process
      required: false
      note: Fix the diagnosed bug
  output: templates/diagnose.md
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| goes-to | /dev-process | no | Fix after diagnosis |
| output | templates/diagnose.md | yes | Diagnosis report |

## Instructions

Six phases. Skip only when explicitly justified.

1. **Build a feedback loop.** This is THE skill. Find a tight pass/fail signal
   for the bug — one command that goes red on THIS bug. Spend disproportionate
   effort here. Try: failing test, curl, CLI invocation, headless browser,
   replay trace, throwaway harness, fuzz loop, bisection, differential loop.

2. **Reproduce + minimize.** Run the loop, watch it go red. Confirm it matches
   the user's symptom. Shrink to the smallest scenario that still fails.

3. **Hypothesize.** Generate 3-5 ranked, falsifiable hypotheses BEFORE testing
   any. Show the user — they often have domain knowledge that re-ranks instantly.

4. **Instrument.** One variable at a time. Prefer debugger > targeted logs >
   never "log everything and grep". Tag debug logs with `[DEBUG-xxxx]`.

5. **Fix + regression test.** Write the test before the fix. Watch it fail.
   Apply fix. Watch it pass.

6. **Cleanup.** Remove all `[DEBUG-*]` instrumentation. State the root cause
   in the commit message.
```

#### `/review` — Code Review

```markdown
---
kind: skill
name: review
description: >-
  Review code changes for correctness, security, and quality.
  Use after verification passes.
trigger: model-invoked
relationships:
  comes-from:
    - target: /verify
      required: false
  can-invoke:
    - target: /review-security
      required: false
      note: If security-sensitive changes
  output: templates/review.md
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /verify | no | After verification |
| can-invoke | /review-security | no | Security-sensitive changes |
| output | templates/review.md | yes | Review report |

## Instructions

Review the diff (staged or branch changes) for:

1. **Correctness** — logic errors, edge cases, off-by-one, null handling.
2. **Security** — injection, auth bypass, data exposure. If concerning, invoke
   /review-security.
3. **Quality** — readability, naming, unnecessary complexity, dead code.
4. **Tests** — are changes covered? Are tests meaningful or tautological?

Report findings ranked by severity. For each finding, state: what's wrong,
why it matters, and how to fix it.
```

#### `/to-spec` — Conversation to Spec

```markdown
---
kind: skill
name: to-spec
description: >-
  Turn the current conversation into a structured spec.
  Use when requirements are settled and need to be documented.
trigger: user-invoked
relationships:
  comes-from:
    - target: /grill-me
      required: false
  goes-to:
    - target: /to-tickets
      required: false
  output: templates/to-spec.md
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /grill-me | no | Spec from grilled requirements |
| goes-to | /to-tickets | no | Break spec into tickets |
| output | templates/to-spec.md | yes | Spec document |

## Instructions

Synthesize the current conversation into a spec. Do NOT interview — just
synthesize what you already know.

Sections:
1. **Problem statement** — from the user's perspective.
2. **Solution** — from the user's perspective.
3. **User stories** — extensive numbered list.
4. **Implementation decisions** — modules, interfaces, architecture. No file paths.
5. **Testing decisions** — what to test, at which seams, prior art.
6. **Out of scope** — what this spec does NOT cover.
```

#### `/to-tickets` — Spec to Tickets

```markdown
---
kind: skill
name: to-tickets
description: >-
  Break a plan, spec, or conversation into tracer-bullet tickets.
  Use when work needs to be decomposed into implementable slices.
trigger: user-invoked
relationships:
  comes-from:
    - target: /to-spec
      required: false
  output: templates/to-tickets.md
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /to-spec | no | Tickets from spec |
| output | templates/to-tickets.md | yes | Ticket list |

## Instructions

Break work into **tracer bullet** vertical slices.

Each slice:
- Cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests).
- Is demoable or verifiable on its own.
- Is sized to fit in a single agent context window.

Give each ticket blocking edges — which tickets must complete first.

Present as numbered list with: title, blocked by, what it delivers.
Ask the user if granularity is right. Iterate until approved.

Write tickets to {{DOCS_DIR}}/tickets/ or the project's issue tracker.
```

#### `/create-resource` — Dynamic Resource Creation

```markdown
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
```

#### `/onboard` — First-Time Setup

```markdown
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
```

#### `/docs-workflow` — Large Documentation Effort

```markdown
---
kind: skill
name: docs-workflow
description: >-
  Structured documentation generation for large efforts.
  Use for new docs, major rewrites. For small updates, use /docs.
trigger: user-invoked
relationships:
  comes-from:
    - target: /docs
      required: false
  output: templates/docs-workflow.md
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /docs | no | Escalated from /docs |
| output | templates/docs-workflow.md | yes | Docs workflow report |

## Instructions

1. **Requirements.** State what docs are needed and why. List open questions.
2. **Stakeholder input.** Present questions to user. Wait for answers.
3. **Strategy.** Propose 2-3 approaches with pros/cons. Recommend one. Wait.
4. **Plan.** Create checklist. Validate with user.
5. **Execute.** Write documentation following approved plan.
```

#### `/review-security` — Security Review

```markdown
---
kind: skill
name: review-security
description: >-
  Focused security review of code changes.
  Use when changes touch auth, input handling, data exposure, or crypto.
trigger: user-invoked
relationships:
  comes-from:
    - target: /review
      required: false
  output: templates/review-security.md
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /review | no | Escalated from general review |
| output | templates/review-security.md | yes | Security review report |

## Instructions

Review the diff specifically for security concerns:

1. **Injection** — SQL, command, XSS, template injection.
2. **Auth/AuthZ** — bypass, privilege escalation, missing checks.
3. **Data exposure** — secrets in code, PII logging, error leakage.
4. **Crypto** — weak algorithms, hardcoded keys, insecure randomness.
5. **Dependencies** — known vulnerabilities in added packages.

For each finding: severity (critical/high/medium/low), description, fix.
```

---

### 5.3 Default Agents

#### `reviewer` — Code Review Agent

```markdown
---
kind: agent
name: reviewer
description: >-
  Code review specialist. Spawned as subagent to review diffs
  for correctness, security, and quality.
persona: >-
  You are a meticulous code reviewer. You find real bugs, not style nits.
  You rank findings by severity and always suggest concrete fixes.
tools: [read, grep, git-diff]
constraints:
  - Never modify code — only report findings.
  - Rank by severity, most critical first.
  - For each finding, state what's wrong, why, and how to fix.
relationships:
  uses:
    - target: /review
      required: true
    - target: /review-security
      required: false
  output: templates/review.md
---
```

#### `researcher` — Background Research Agent

```markdown
---
kind: agent
name: researcher
description: >-
  Research specialist. Spawned as background subagent to investigate
  questions against primary sources.
persona: >-
  You are a thorough researcher. You only cite primary sources.
  You follow every claim back to the source that owns it.
tools: [read, web-fetch, web-search, grep]
constraints:
  - Only primary sources — official docs, source code, specs.
  - Cite every claim with its source.
  - Write findings to a single Markdown file.
relationships:
  uses:
    - target: /research
      required: true
  output: templates/research.md
---
```

#### `architect` — Architecture Review Agent

```markdown
---
kind: agent
name: architect
description: >-
  Architecture specialist. Reviews structural compliance
  and suggests improvements.
persona: >-
  You are a software architect focused on deep modules, clean seams,
  and documented structure. You compare actual code against documented
  architecture and flag drift.
tools: [read, grep, find]
constraints:
  - Compare against documented architecture only — do not invent one.
  - Flag gaps, not preferences.
  - Recommend fixing code OR docs, never both silently.
relationships:
  uses:
    - target: /architecture-compliance
      required: true
  output: templates/architecture-compliance.md
---
```

---

### 5.4 Default Workflows

#### `feature-dev` — Feature Development

```markdown
---
kind: workflow
name: feature-dev
description: >-
  Full feature development workflow.
  Use for new features that need planning, implementation, and review.
phases:
  - name: Discover
    skills: [/grill-me]
    gate: User confirms requirements are complete
  - name: Plan
    skills: [/architecture-compliance, /to-spec]
    gate: User approves spec
  - name: Develop
    skills: [/dev-process, /tdd]
  - name: Verify
    skills: [/verify, /test-cycle]
    gate: All checks pass
  - name: Review
    skills: [/review]
  - name: Document
    skills: [/docs]
relationships:
  output: templates/workflow-summary.md
---

## Relationships

| Phase | Skills | Gate |
|-------|--------|------|
| Discover | /grill-me | User confirms requirements |
| Plan | /architecture-compliance, /to-spec | User approves spec |
| Develop | /dev-process, /tdd | — |
| Verify | /verify, /test-cycle | All checks pass |
| Review | /review | — |
| Document | /docs | — |

## Instructions

Guide the user through a full feature development cycle. Each phase invokes
its skills in order. Gates require user confirmation before proceeding.

Phases can be skipped if the user explicitly requests it, but flag what was
skipped in the workflow summary.
```

#### `bug-fix` — Bug Fix

```markdown
---
kind: workflow
name: bug-fix
description: >-
  Bug fix workflow. Diagnose, fix, verify.
phases:
  - name: Diagnose
    skills: [/diagnose]
    gate: Root cause identified
  - name: Fix
    skills: [/dev-process]
  - name: Verify
    skills: [/verify]
  - name: Review
    skills: [/review]
relationships:
  output: templates/workflow-summary.md
---

## Relationships

| Phase | Skills | Gate |
|-------|--------|------|
| Diagnose | /diagnose | Root cause identified |
| Fix | /dev-process | — |
| Verify | /verify | All checks pass |
| Review | /review | — |
```

#### `docs-gen` — Documentation Generation

```markdown
---
kind: workflow
name: docs-gen
description: >-
  Documentation generation workflow for large doc efforts.
phases:
  - name: Assess
    skills: [/docs]
    gate: Gaps identified
  - name: Plan
    skills: [/docs-workflow]
    gate: User approves strategy
  - name: Execute
    skills: [/docs-workflow]
  - name: Review
    skills: [/review]
relationships:
  output: templates/workflow-summary.md
---
```

---

### 5.5 Default Loop

#### `pr-babysit` — PR Babysitter

```markdown
---
kind: loop
name: pr-babysit
description: >-
  Keep a PR merge-ready by resolving comments, fixing CI, and
  handling merge conflicts in a loop.
trigger: user-invoked
schedule: "interval:5m"
wraps: /verify
relationships:
  can-invoke:
    - target: /verify
      required: true
    - target: /review
      required: false
  output: templates/pr-babysit.md
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| can-invoke | /verify | yes | Check CI status |
| can-invoke | /review | no | Triage comments |
| output | templates/pr-babysit.md | yes | Loop iteration report |

## Instructions

Check PR status, comments, and CI. Resolve issues until merge-ready.

1. **Merge conflicts.** Resolve intelligently. If intents conflict, ask.
2. **Comments.** Review unresolved comments. Address valid ones.
3. **CI.** Fix CI failures caused by this PR's changes. Never change CI
   config just to make it pass. Push fixes and re-check.

Loop until: green CI + no unresolved comments + no conflicts.
```

---

### 5.6 Optional Resources (gated by ENABLE_* flags)

These are loaded ONLY when their `ENABLE_*` flag is `true` in `.common-rules-mcp.env`.

| Resource | Kind | Gate | Purpose |
|----------|------|------|---------|
| `notebook` | skill | `ENABLE_NOTEBOOKS` | Track decisions in dated notebook files |
| `daily-logbook` | skill | `ENABLE_DAILY_LOGBOOK` | Daily summary from notebooks |
| `compliance` | skill | `ENABLE_COMPLIANCE` | Validate against documented requirements |
| `deviation` | skill | `ENABLE_DEVIATION` | Request/document process deviations |
| `code-style` | skill | `LINTER_TOOL` is set | Language-agnostic lint validation |

These follow the same unified format. Their full content is in the playbook's
Phase 3.3 but omitted here for brevity — they are simplified versions of the
current rules, rewritten in natural language.

---

## 6. Configuration System

### `.common-rules-mcp.env`

Location: `$PROJECT_ROOT/.common-rules-mcp.env`

```env
# ═══════════════════════════════════════════════════════════════
# Common Rules MCP — Project Configuration
# ═══════════════════════════════════════════════════════════════
# Auto-generated by /onboard or setup_config().
# Lines starting with # are comments. Empty values use defaults.
# ═══════════════════════════════════════════════════════════════

# ── Project Identity ──────────────────────────────────────────
# Project name (used in reports and logs)
PROJECT_NAME=

# Primary language (e.g., python, java, typescript, rust, go)
# Auto-detected from file extensions if empty.
PROJECT_LANGUAGE=

# ── Documentation ─────────────────────────────────────────────
# Path to project overview doc (default: README.md)
README_PATH=README.md

# Path to architecture doc (default: ARCHITECTURE.md)
ARCHITECTURE_PATH=ARCHITECTURE.md

# Additional docs directory (default: docs/)
DOCS_DIR=docs/

# ── Build & Test ──────────────────────────────────────────────
# Build system (auto-detected: gradle, maven, npm, python, cargo)
BUILD_SYSTEM=

# Build command (e.g., "npm run build", "uv run build")
BUILD_COMMAND=

# Test command (e.g., "npm test", "uv run pytest")
TEST_COMMAND=

# Coverage command (e.g., "uv run pytest --cov")
COVERAGE_COMMAND=

# Minimum coverage threshold (default: 80)
COVERAGE_THRESHOLD=80

# ── Code Style (optional) ────────────────────────────────────
# Linter tool (e.g., ruff, eslint, checkstyle, clippy)
LINTER_TOOL=

# Linter config path (e.g., ruff.toml, .eslintrc.js)
LINTER_CONFIG=

# Lint command (e.g., "uv run ruff check .", "npm run lint")
LINT_COMMAND=

# ── Optional Features ────────────────────────────────────────
# Enable notebook tracking (default: false)
ENABLE_NOTEBOOKS=false

# Notebook directory (default: ./notebook/)
NOTEBOOK_DIR=./notebook/

# Enable daily logbook summaries (default: false)
ENABLE_DAILY_LOGBOOK=false

# Enable deviation tracking (default: false)
ENABLE_DEVIATION=false

# Enable compliance confirmation (default: false)
ENABLE_COMPLIANCE=false

# ── Dynamic Resources ────────────────────────────────────────
# Where project-level resources are stored (default: .common-rules/)
RESOURCES_DIR=.common-rules/

# ── Advanced ──────────────────────────────────────────────────
# Git commit message prefix (e.g., "feat:", "[PROJ-123]")
COMMIT_PREFIX=

# Deployment command (leave empty if none)
DEPLOY_COMMAND=

# Pre-commit checks (leave empty to skip)
PRE_COMMIT_COMMAND=
```

### Resolution order

1. `.common-rules-mcp.env` values (explicit)
2. Auto-detected values (build system, language)
3. Defaults (README_PATH=README.md, COVERAGE_THRESHOLD=80, etc.)

---

## 7. Directory Structure

### MCP server repository (built-in resources)

```
src/common_rules_server/
├── mcp_server.py                    # MCP tools: get_context, get_resource, create_resource, setup_config
├── service/
│   ├── resource_service.py          # Unified resource loading, parsing, env resolution
│   └── config_service.py            # .env loading, auto-detection, defaults
├── util/
│   └── resource_parsing.py          # Unified YAML frontmatter parser (replaces rule_parsing.py)
└── resources/
    ├── rules/
    │   ├── general.md
    │   └── orchestrator.md
    ├── skills/
    │   ├── grill-me.md
    │   ├── dev-process.md
    │   ├── tdd.md
    │   ├── verify.md
    │   ├── test-cycle.md
    │   ├── docs.md
    │   ├── docs-workflow.md
    │   ├── architecture-compliance.md
    │   ├── research.md
    │   ├── diagnose.md
    │   ├── review.md
    │   ├── review-security.md
    │   ├── to-spec.md
    │   ├── to-tickets.md
    │   ├── create-resource.md
    │   └── onboard.md
    ├── agents/
    │   ├── reviewer.md
    │   ├── researcher.md
    │   └── architect.md
    ├── workflows/
    │   ├── feature-dev.md
    │   ├── bug-fix.md
    │   └── docs-gen.md
    ├── loops/
    │   └── pr-babysit.md
    ├── optional/
    │   ├── notebook.md
    │   ├── daily-logbook.md
    │   ├── compliance.md
    │   ├── deviation.md
    │   └── code-style.md
    └── templates/
        ├── general.md
        ├── orchestrator.md
        ├── dev-process.md
        ├── tdd.md
        ├── verify.md
        ├── test-cycle.md
        ├── docs.md
        ├── docs-workflow.md
        ├── architecture-compliance.md
        ├── research.md
        ├── diagnose.md
        ├── review.md
        ├── review-security.md
        ├── to-spec.md
        ├── to-tickets.md
        ├── create-resource.md
        ├── onboard.md
        ├── workflow-summary.md
        ├── pr-babysit.md
        └── grill-me.md
```

### Project-level resources (created by agent/user)

```
$PROJECT_ROOT/
├── .common-rules-mcp.env           # Project config
└── .common-rules/                   # Dynamic resources (RESOURCES_DIR)
    ├── rules/
    ├── skills/
    ├── agents/
    ├── workflows/
    └── loops/
```

### Resource loading priority

1. **Project resources** (`$RESOURCES_DIR/`) — highest priority, overrides built-in
2. **Built-in resources** (`resources/`) — defaults shipped with MCP

---

## 8. Execution Plan

### Phase 1: Foundation (resource format + config + API)

| Step | Action | Files |
|------|--------|-------|
| 1.1 | Tag current state: `git tag v0.1.0-pseudocode` | — |
| 1.2 | Replace `rule_parsing.py` with `resource_parsing.py` — unified parser for all kinds | `util/resource_parsing.py` |
| 1.3 | Create `config_service.py` — .env loading, auto-detection, defaults | `service/config_service.py` |
| 1.4 | Replace `rule_service.py` with `resource_service.py` — unified resource loading | `service/resource_service.py` |
| 1.5 | Rewrite `mcp_server.py` — 4 tools: `get_context`, `get_resource`, `create_resource`, `setup_config` | `mcp_server.py` |
| 1.6 | Update tests | `test/` |

### Phase 2: Resources (rewrite all rules + create new skills/agents/workflows)

| Step | Action | Files |
|------|--------|-------|
| 2.1 | Write 2 system rules (general, orchestrator) | `resources/rules/` |
| 2.2 | Write 16 core skills | `resources/skills/` |
| 2.3 | Write 3 default agents | `resources/agents/` |
| 2.4 | Write 3 default workflows | `resources/workflows/` |
| 2.5 | Write 1 default loop | `resources/loops/` |
| 2.6 | Write 5 optional resources | `resources/optional/` |
| 2.7 | Write 20 simplified templates | `resources/templates/` |

### Phase 3: Cleanup

| Step | Action |
|------|--------|
| 3.1 | Delete old rule files (`resources/rules/system/`, `resources/rules/user/`) |
| 3.2 | Delete old templates (`resources/artifacts/templates/`) |
| 3.3 | Delete `domain/rule.py` if unused |
| 3.4 | Delete `resources/artifacts/code_style/` (now config-driven via LINTER_*) |
| 3.5 | Update `.cursor/rules/global.mdc` or remove |
| 3.6 | Run full test suite |
| 3.7 | Manual smoke test with debug client |

### Phase 4: Documentation

| Step | Action |
|------|--------|
| 4.1 | Rewrite README.md — new architecture, new API, setup guide |
| 4.2 | Rewrite ARCHITECTURE.md — unified resource model, API contract, config system |

### Rollback

```bash
git checkout v0.1.0-pseudocode
```

---

## Size Comparison

| Metric | Before | After |
|--------|--------|-------|
| Resource files | 13 rules | 2 rules + 16 skills + 3 agents + 3 workflows + 1 loop + 5 optional = **30** |
| Avg lines per resource | ~170 | ~30 |
| Total resource lines | ~2,200 | ~900 |
| Template files | 14 (verbose) | 20 (minimal, ≤15 lines each) |
| MCP tools | 6 (thin CRUD) | 4 (rich composite) |
| Config files | 0 | 1 (.common-rules-mcp.env) |
| Resource kinds | 1 (rule) | 5 (rule, skill, agent, workflow, loop) |
