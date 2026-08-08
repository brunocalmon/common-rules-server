---
kind: skill
name: architecture-compliance
description: >-
  Compare the documented architecture against the code as it actually is. Use
  before structural changes, or when the two may have drifted apart.
trigger: model-invoked
relationships:
  comes-from:
    - target: /orchestrator
      required: false
  goes-to:
    - target: /docs
      required: false
      note: When the documentation is what is wrong
  output: templates/architecture-compliance.md
env:
  optional: [WIKI_DIR]
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /orchestrator | no | Part of planning |
| goes-to | /docs | no | When documentation is the thing to fix |
| output | templates/architecture-compliance.md | yes | Compliance report |

## Instructions

Read the architecture documentation in {{WIKI_DIR}} and compare it against the
codebase. Use `code-review-graph` for the structural side — it answers questions
about real dependencies and module boundaries that reading files one at a time
answers slowly and unreliably.

| Dimension | Documented | Actual |
|---|---|---|
| Layout | The structure the wiki describes | The structure on disk |
| Patterns | The patterns the wiki claims | The patterns the code uses |
| Boundaries | Which module owns what | Which module actually depends on what |
| Build | The described build system | The build files present |

For each dimension, report compliant or drifted. Where they have drifted, say
which side is wrong. Sometimes the code has grown past its documentation and the
documentation should change; sometimes the code has broken a boundary the
project still intends to hold. These call for opposite fixes, so do not report
drift without saying which one it is.

If there is no architecture documentation, stop. Report that, and offer /docs.
Inventing an architecture to measure against would produce findings that reflect
your preferences rather than the project's intent.
