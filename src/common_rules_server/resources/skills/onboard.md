---
kind: skill
name: onboard
description: >-
  Configure this project for orchestration on first use. Use when configuration
  is missing, or when the user asks to set things up.
trigger: model-invoked
relationships:
  goes-to:
    - target: /general
      required: false
      note: Orient once configured
  output: templates/onboard.md
self_check:
  - Did I ask one question at a time rather than presenting a wall of configuration?
  - Did I work through every item in next_steps?
  - Did I let the user choose the optional features rather than enabling them?
  - Did I confirm TEST_COMMAND by running it, rather than only asking?
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| goes-to | /general | no | Orient once configured |
| output | templates/onboard.md | yes | Setup report |

## Instructions

Run `setup_config()` first. It writes the configuration file with every setting
explained, detects what it can from the project, installs the commit-message
hook that keeps AI trailers out of your commit authorship, and writes
orchestration guidance where this editor will read it.

Then work through what it could not answer.

**Read `next_steps` in the response.** Everything listed there needs a human.
Take them one at a time — a wall of configuration questions gets abandoned
halfway, and half-configured is the state where the agent behaves inconsistently
without anyone knowing why.

For each key in `env_status.needs_input`, say what it is for before asking, and
offer what you found in the project as a starting point. `TEST_COMMAND` is worth
confirming by running it once rather than by asking.

**Ask about optional features rather than enabling them.** Notebooks, daily
logbooks, compliance checks and deviation records are each useful in some
projects and pure overhead in others. Describe what each one does and let the
user choose.

**Report the companions.** If `code-review-graph` or `context-mode` are missing,
say what they do and what they cost to add. They are not required, and the setup
does not modify editor-wide configuration on its own — that file is shared with
every other project the user works on.

Finish by summarising the configuration in plain terms and confirming it.
