---
kind: skill
name: review
description: >-
  Review changes for correctness, security and quality, ranked by consequence.
  Use once the build is green.
trigger: model-invoked
relationships:
  comes-from:
    - target: /verify
      required: false
      note: Reviewing a broken build wastes the review
  can-invoke:
    - target: /review-security
      required: false
      note: When the change touches a security boundary
  output: templates/review.md
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /verify | no | Review a green build |
| can-invoke | /review-security | no | Security-sensitive changes |
| output | templates/review.md | yes | Review report |

## Instructions

Review the diff — staged changes, or the branch against its base.

Start with `code-review-graph`: ask for the review context and the impact radius
of the changed symbols. A diff read in isolation hides the callers that the
change breaks, and those are where the real defects are.

Look for, in this order:

1. **Correctness.** Logic errors, unhandled edge cases, boundary conditions,
   null and empty handling, error paths that swallow failures, concurrency
   assumptions that do not hold.
2. **Security.** Untrusted input reaching a sensitive sink, missing authorisation
   checks, secrets in code, data exposed through logs or errors. If any of this
   looks real, invoke /review-security rather than judging it in passing.
3. **Quality.** Naming that misleads, complexity that is not carrying its
   weight, duplicated logic, dead code left behind.
4. **Tests.** Is the changed behaviour actually covered, and does the test fail
   if the behaviour regresses? A test that cannot fail is not coverage.

**Rank by consequence and be specific.** For each finding state what is wrong,
what breaks as a result, and how to fix it. A finding without a concrete failure
case is usually a preference, and preferences dressed as defects make the real
defects harder to see.

Report having found nothing when you found nothing. Manufacturing findings to
appear thorough costs the user attention and teaches them to discount the next
review.
