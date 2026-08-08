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
  optional: [README_PATH, WIKI_DIR, BUILD_COMMAND]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| goes-to | /orchestrator | yes | Feeds into workflow selection |
| output | templates/general.md | yes | Health check report |

## Instructions

Run a workspace health check and report status.

**Documentation.** Check if {{README_PATH}} and {{WIKI_DIR}} exist.
The {{README_PATH}} at the root is just a Hub. The actual documentation lives in {{WIKI_DIR}}.
If both exist, read them to understand the project. If either is missing, note
it — do not assume anything about the project.

**Git.** Run `git status --porcelain`. If uncommitted changes exist, remind
the user.

**Build system.** If {{BUILD_COMMAND}} is set, note it. Otherwise, detect from
project files (package.json, pyproject.toml, build.gradle, pom.xml, Cargo.toml)
and read the build command from documentation. If undetermined, ask.