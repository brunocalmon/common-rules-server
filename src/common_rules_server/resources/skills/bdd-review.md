---
kind: skill
name: bdd-review
description: >-
  Assess whether acceptance scenarios genuinely cover the system's behaviour.
  Use after execution, or when the suite has drifted from the contracts.
trigger: user-invoked
relationships:
  comes-from:
    - target: /bdd-run
      required: false
  goes-to:
    - target: /bdd-generate
      required: false
      note: Write the scenarios found missing
  output: templates/bdd-review.md
env:
  optional: [BDD_FILE_PATH]
self_check:
  - Did I judge the suite against the system's real surface, or against itself?
  - Did I check each scenario's assertions against the real contract?
  - Did I report the happy-path-to-error balance honestly?
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /bdd-run | no | Assess after execution |
| goes-to | /bdd-generate | no | Write the missing scenarios |
| output | templates/bdd-review.md | yes | Coverage assessment |

## Instructions

Judge the suite against the system, not against itself.

**Coverage.** Enumerate the system's real surface — every tool, endpoint or
entry point, and every documented behaviour. Mark each as covered or not.
Report the ones that are not; those are the parts nobody is checking.

**Contract accuracy.** For each scenario, compare its assertions against the
real contract. Any field abbreviated, omitted, approximated or invented is a
defect in the scenario. These are the dangerous ones: they pass, and they pass
whether or not the system is correct.

**Balance.** Count happy path, boundary and error scenarios separately. A suite
weighted towards happy paths reports health rather than measuring it.

**Independence.** Any scenario that only passes after another has run is
mis-written, because scenarios are executed one at a time.

**Value.** Name scenarios that assert nothing meaningful — a status code with no
check on the body, an assertion that restates the input. Recommend removing
them. A suite kept honest is more useful than a suite kept large.

Report findings as concrete gaps with the scenario that should exist, and hand
them to /bdd-generate.
