---
kind: skill
name: docs-workflow
description: >-
  Run a large documentation effort as a staged project with explicit approval
  gates. Use for new documentation sets or major rewrites; for small updates use
  /docs.
trigger: user-invoked
relationships:
  comes-from:
    - target: /docs
      required: false
      note: Escalated when the gap is too large for an update
  output: templates/docs-workflow.md
env:
  optional: [WIKI_DIR, DOCS_PROTOCOL]
self_check:
  - Did I stop at each gate and wait, rather than announcing and continuing?
  - Did I state what is out of scope before writing anything?
  - Did I report what I could not write because the answer was unavailable?
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /docs | no | Escalated from a routine update |
| output | templates/docs-workflow.md | yes | Effort report |

## Instructions

Large documentation efforts fail by producing volume nobody asked for. Stage the
work and stop at each gate.

1. **Scope.** State what documentation is needed and why, and what is explicitly
   out of scope. List the open questions.
2. **Input.** Put those questions to the user. Wait. This is a gate.
3. **Strategy.** Propose two or three approaches with their trade-offs, and
   recommend one. Wait. This is a gate.
4. **Plan.** Turn the approved strategy into a checklist of documents, each with
   its purpose and its place in {{WIKI_DIR}}. Confirm.
5. **Write.** Work the checklist. Follow {{DOCS_PROTOCOL}} for anything that
   supersedes existing guidance.

Report progress against the checklist, and name anything you could not write
because the answer was not available.
