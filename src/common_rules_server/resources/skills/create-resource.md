---
kind: skill
name: create-resource
description: >-
  Create a new rule, skill, agent, workflow or loop for this project. Use when
  the default kit does not cover how this project works.
trigger: user-invoked
relationships:
  output: templates/create-resource.md
env:
  optional: [RESOURCES_DIR]
self_check:
  - Did I check for an existing resource that already covers this?
  - Is the description written so another agent can choose on it alone?
  - Did I confirm it loads and its references resolve after creating it?
  - Is it natural language, with no pseudo-code and no invented control flow?
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| output | templates/create-resource.md | yes | Creation report |

## Instructions

**First, check whether this should exist.** Call `get_context()` and look for a
resource that already covers it. Overlapping resources are worse than a missing
one: the agent has to choose between two partial answers, and neither gets
maintained. If something close exists, specialise it by creating a project
resource with the same kind and name — that overrides the built-in rather than
competing with it.

**Then choose the kind**, which is a question about what the thing *is*:

| Kind | It is | Test |
|---|---|---|
| rule | Standing behaviour the agent follows | Applies without being asked for |
| skill | An action with steps | Someone invokes it to get something done |
| agent | A persona with a toolset and limits | Describes *who* executes, not what |
| workflow | An ordered set of skills with gates | Sequences existing skills |
| loop | A workflow with a trigger or schedule | Recurs until a condition holds |

**Gather what it needs.** A one-line description written so another agent can
tell from it alone whether this is the right resource. Where it comes from,
where it goes, what it may invoke, and which of those edges are required. Which
configuration keys it depends on. What its output should look like.

**Write it in natural language.** Imperative, direct, no pseudo-code, no
invented control flow. Wrap anything configurable in double curly braces around
a configuration key name, the way every resource in this kit does, and reference
other resources as `/name`. Explain why a step matters where the reason is not
obvious — an instruction whose purpose is understood survives contact with a
situation its author did not foresee.

Persist it with the `create_resource` tool. It writes into this project only and
never touches the built-in kit. Then call `get_context()` again to confirm it
loaded and its references resolve.
