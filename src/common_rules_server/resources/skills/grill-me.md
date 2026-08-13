---
kind: skill
name: grill-me
description: >-
  Interrogate a plan, idea or requirement until nothing is left assumed. Use
  before non-trivial work, or when the user asks to have their thinking
  stress-tested.
trigger: both
relationships:
  goes-to:
    - target: /to-spec
      required: false
      note: Once settled, capture the outcome as a spec
    - target: /dev-process
      required: false
      note: Or go straight to implementation
  can-invoke:
    - target: /research
      required: false
      note: When a question needs facts nobody in the room has
  output: templates/grill-me.md
self_check:
  - Is the frontier genuinely empty, or did I stop at the comfortable questions?
  - Did I look up every fact myself rather than asking the user for something I could find?
  - Did I give a real recommendation for each question, or hedge?
  - Did I ask what happens when this fails, and what we are choosing not to build?
  - Did I challenge at least one premise the user took for granted?
  - Did I push back on vague answers instead of accepting them?
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| goes-to | /to-spec | no | Capture the settled outcome |
| goes-to | /dev-process | no | Proceed to implementation |
| can-invoke | /research | no | When facts are missing |
| output | templates/grill-me.md | yes | Grilling summary |

## Instructions

Interview the user until you share an understanding of what is being built and
why. Treat it as a decision tree: every answer opens the decisions that hang
off it.

**Be adversarial, not agreeable.** Your job is to find the holes before they
become expensive. Challenge premises the user takes for granted. If the user
says "we need X", ask why not Y. If the answer is vague, say it is vague and
push for specifics. Technical roasting is a feature: a brief that survives a
grilling is a brief worth building against; one that does not was going to fail
at implementation time anyway, where it costs ten times more to discover.

Do not be rude — be relentlessly precise. The difference between a good
grilling and a bad one is that the good one leaves the user with a better plan,
not a worse mood.

**Work in rounds.** The frontier is every decision whose prerequisites are
already settled — the questions that can be answered *now*. Ask the whole
frontier in one round, then wait. Drip-feeding one question at a time wastes the
user's attention.

Number every question and commit to a recommendation:

```
Q1 — Short title
Question body, one or two sentences.
Recommendation: what you would do, and why.
```

A recommendation is not a formality. It turns a question the user has to think
about into one they can simply confirm or correct, which is faster and surfaces
disagreement sooner.

**Look things up yourself.** Any question you could answer by reading the code,
the wiki or the configuration is not a question for the user. Ask only what
lives in their head: intent, priorities, constraints, taste. Use
`code-review-graph` for structural questions and `context-mode` for what this
project already decided.

**Push on what is being avoided.** The valuable questions are usually the ones
that sound uncomfortable: what happens when this fails, what are we choosing not
to build, who is hurt if this is wrong, what would make us abandon this. If the
user deflects, note the deflection and come back to it.

**Stop when the frontier is empty** — every branch visited, nothing left
silently assumed. Then summarise the decisions and name what remains genuinely
open, rather than pretending it closed.
