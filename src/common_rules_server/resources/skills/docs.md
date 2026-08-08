---
kind: skill
name: docs
description: >-
  Keep project documentation true to the code, following the wiki hub model and
  the project's documentation protocol. Use after behaviour or architecture
  changes, or when documentation is missing.
trigger: model-invoked
relationships:
  can-invoke:
    - target: /docs-workflow
      required: false
      note: For a large documentation effort rather than an update
  output: templates/docs.md
env:
  optional: [README_PATH, WIKI_DIR, DOCS_PROTOCOL]
self_check:
  - Did I follow the documentation protocol, including the mirror marker on the superseded document?
  - Is the root README still a hub, with no long-form content added to it?
  - Did I write only what I could confirm, rather than inventing plausible content?
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| can-invoke | /docs-workflow | no | Large documentation efforts |
| output | templates/docs.md | yes | Documentation report |

## Instructions

**The hub rule.** {{README_PATH}} at the repository root is a hub. It says what
the project is in a few lines and links into the wiki. Architecture, guides,
decisions and long-form explanation belong in {{WIKI_DIR}}, never in the root
README. When you find such content in the README, move it into the wiki and
leave a link.

**The protocol.** {{DOCS_PROTOCOL}} governs how decisions are recorded and
replaced. Read it before editing anything, and follow it exactly. Its central
rule is that a decision is never overwritten silently: when a new document
changes how an older one should be read, both ends are updated so a reader
arriving at either one is sent to the other.

That means, on any change that supersedes prior guidance:

1. Add the impact footer to the new document, stating what it changes.
2. Mark the point of change inline with `[→ overrides <DOC> §<section>]`.
3. Edit the superseded document to carry the mirror marker
   `[← overridden by <DOC> §<section>]`.

Skipping step three is the failure that matters. A reader who lands on the old
page has no way to know it is stale.

**Reviewing.** Check the wiki against the code. Report anything that describes
behaviour the code no longer has. Do not invent replacement content — ask.

**Updating.** After a code change, ask what became untrue. Public behaviour or
interface changes, module boundary changes, and new decisions all need a
documentation change. Internal refactors that preserve behaviour usually do not.

**Creating.** When documentation is missing, draw it out of the user with
targeted questions. Documentation generated from reading the code repeats what
the code already says and omits the reasoning, which is the only part that
cannot be recovered later.
