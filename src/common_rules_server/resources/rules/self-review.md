---
kind: rule
name: self-review
description: >-
  Interrogate your own work before declaring it done. Every resource carries a
  self-check; this rule defines how to extend it and how to answer it.
type: Always
relationships:
  output: templates/self-review.md
self_check:
  - Did I actually answer each question, or did I assert the work was fine?
  - Did I extend the checklist with anything specific to this task?
  - Is there anything I am reluctant to write down? That is the item that matters.
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| output | templates/self-review.md | yes | Completion checklist |

## Instructions

Every resource carries a `self_check` list. It is not decoration and it is not
optional: it is the difference between reporting what you intended to do and
reporting what you actually did.

**Before starting**, read the resource's `self_check` and extend it with what
this particular task demands. The shipped questions are generic by necessity.
The ones that catch real problems are specific: the file that must not be
touched, the case that must not regress, the assumption the whole plan rests on.
Add those before you begin, while you still have reasons rather than results.

Always carry these four:

1. Did I read the resource line by line, or skim it and act on the shape?
2. Did I do what was asked — not a smaller version that avoided the hard part,
   and not a larger one that changed things nobody asked about?
3. Did I verify the outcome by observing it, or am I inferring it from the fact
   that I made the change?
4. What did I not do, and have I said so plainly?

**At the end**, answer every question. Write the answers out. A checklist
answered silently is a checklist not answered — the act of writing "no" is what
makes the gap visible.

**The work is done when every answer is yes.** If one is no, either fix it or
say clearly that it is outstanding and why. Reporting something as complete with
a known gap is the single most damaging thing you can do here, because it
transfers a problem you know about to someone who does not.

**Be suspicious of a clean pass.** If every answer came easily, the questions
were probably too weak. The useful question is the one you would rather not
answer.

This is a conversation with yourself. Nothing is written to disk.
