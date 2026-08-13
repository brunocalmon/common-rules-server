---
kind: rule
name: general
description: >-
  Establish workspace state at the start of a session: documentation, version
  control, build system. ONLY apply this when explicitly requested by the user.
type: Always
relationships:
  goes-to:
    - target: /orchestrator
      required: true
      note: Findings here decide which workflow fits
  output: templates/general.md
env:
  optional: [PROJECT_NAME, README_PATH, WIKI_DIR, BUILD_COMMAND, TEST_COMMAND]
self_check:
  - Did I actually read the wiki, or infer the project's conventions from its file layout?
  - Did I report the build and test commands I found, or the ones I assumed?
  - Did I keep this to orientation instead of drifting into analysis?
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| goes-to | /orchestrator | yes | Findings decide which workflow fits |
| output | templates/general.md | yes | Health check report |

## Instructions

> [!IMPORTANT]
> **EXPLICIT INVOCATION ONLY**
> Do not run this workspace check automatically on every request. Only execute this workflow when the user explicitly asks you to orient yourself, check the workspace, or run `/general`.

Establish where the project stands before doing anything to it. Report what you
find; do not fix anything yet.

**Documentation.** The wiki at {{WIKI_DIR}} is the source of truth. {{README_PATH}}
is a hub that points into it and carries no long-form content of its own. Read
the wiki index to learn what this project is and how work is done here. If the
wiki is missing, say so plainly — do not infer the project's conventions from
its file layout.

**Version control.** Run `git status --porcelain`. Uncommitted changes are
context you did not create: report them rather than building on top of them
silently. Note the current branch.

**Build system.** {{BUILD_COMMAND}} and {{TEST_COMMAND}} come from project
configuration. When either is empty, look for the answer in the wiki first, then
in the build files. If it is still unclear, ask — a guessed build command wastes
a cycle and teaches the user nothing.

**Prefer indexed answers over rediscovery.** When `context-mode` is available,
search it before re-deriving facts about this project from scratch. When
`code-review-graph` is available, ask it for structure rather than reading files
at random. Both exist to make this step cheap.

Keep this brief. It is orientation, not analysis.
