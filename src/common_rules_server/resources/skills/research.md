---
kind: skill
name: research
description: >-
  Investigate a question against primary sources and record the findings with
  citations. Use when a decision depends on facts nobody currently has.
trigger: model-invoked
relationships:
  goes-to:
    - target: /grill-me
      required: false
      note: Findings feed the interrogation
    - target: /to-spec
      required: false
  output: templates/research.md
env:
  optional: [DOCS_DIR, WIKI_DIR]
self_check:
  - Is every claim traced to a source that owns it, rather than one describing it?
  - Did I separate what I established from what I inferred, and label the second?
  - Did I state what I could not establish rather than filling the gap plausibly?
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| goes-to | /grill-me | no | Findings feed interrogation |
| goes-to | /to-spec | no | Findings feed a spec |
| output | templates/research.md | yes | Research report |

## Instructions

Establish what is true, from sources that own the truth.

**Primary sources only.** Official documentation, specifications, source code,
release notes, the actual API response. Follow every claim back to the thing
that owns it. A blog post describing an API is evidence about the blog post.

**Search what is already known first.** `context-mode` may already hold the
answer for this project; `code-review-graph` answers structural questions about
this codebase directly. Re-deriving a settled fact is the most common waste in
research.

**Cite as you go.** Every claim carries its source. A finding you cannot attribute
is a recollection, and should be labelled as one.

**Say what you could not establish.** The gaps matter as much as the findings —
they are where a decision is still being made on assumption. Never fill one with
a plausible guess presented at the same confidence as a sourced claim.

Write findings to a Markdown file where this project keeps such notes; if there
is no convention, use `{{DOCS_DIR}}/research/`. For anything substantial, run
the investigation as a background agent so it can read widely without consuming
the working session.
