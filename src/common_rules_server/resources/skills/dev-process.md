---
kind: skill
name: dev-process
description: >-
  Implement a change end to end: confirm the documented process, write the code,
  keep the documentation honest. Use when building or fixing something.
trigger: model-invoked
relationships:
  comes-from:
    - target: /grill-me
      required: false
      note: Requirements should be settled first for non-trivial work
    - target: /diagnose
      required: false
      note: A bug is understood before it is fixed
  goes-to:
    - target: /verify
      required: true
      note: Nothing is finished until it builds and passes
  can-invoke:
    - target: /tdd
      required: false
      note: When the project has a test suite
    - target: /docs
      required: false
      note: When behaviour or architecture changed
    - target: /architecture-compliance
      required: false
      note: When the change crosses module boundaries
  output: templates/dev-process.md
env:
  optional: [WIKI_DIR, README_PATH, BUILD_COMMAND, TEST_COMMAND]
self_check:
  - Did I read the documented process before writing code, or start from my own assumptions?
  - Did I make the change that was asked for — not a smaller one avoiding the hard part, nor a larger one touching what was nearby?
  - Did I run /verify, and did it actually pass?
  - Does the code match the surrounding conventions, or my own preferences?
  - Did I check whether documentation became untrue?
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /grill-me | no | Requirements settled first |
| comes-from | /diagnose | no | Bug understood before fixing |
| goes-to | /verify | yes | Nothing ships unverified |
| can-invoke | /tdd | no | Project has tests |
| can-invoke | /docs | no | Behaviour or architecture changed |
| can-invoke | /architecture-compliance | no | Change crosses module boundaries |
| output | templates/dev-process.md | yes | Implementation report |

## Instructions

**Before writing code**, read how this project does it. The wiki at {{WIKI_DIR}}
holds the development guide and the architecture. If that guidance is missing or
contradicts the code, stop and ask — implementing against a guess is how a
codebase acquires two conventions for the same thing.

Ask `code-review-graph` for the impact radius of what you are about to touch.
Knowing what depends on a module before changing it is cheaper than discovering
it from a failing build.

**While writing code**, match the surrounding code: its naming, its structure,
its comment density, its error handling. Code that reads as though it was
already there is easier to review and easier to keep. If the project practises
test-driven development, invoke /tdd rather than writing tests afterwards.

Make the change you were asked for. Not a smaller one that avoids the hard part,
and not a larger one that rewrites what happened to be nearby. When you find a
real problem outside the scope, name it and leave it.

**After writing code**, invoke /verify. This edge is required: a change that has
not been built and tested is a claim, not a result.

Then ask whether the documentation is now wrong. If the change altered public
behaviour, an interface, or a module boundary, invoke /docs. Documentation that
describes the previous version is worse than none, because it is trusted.

**Self-check before reporting.** Were the requirements settled? If this was
non-trivial and nothing was interrogated, say so and offer /grill-me rather than
quietly hoping the assumptions hold.
