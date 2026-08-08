---
kind: skill
name: bdd-run
description: >-
  Execute acceptance scenarios one at a time against the real system and report
  what actually happened. Use to verify behaviour end to end.
trigger: user-invoked
relationships:
  comes-from:
    - target: /bdd-generate
      required: false
  goes-to:
    - target: /bdd-review
      required: false
  can-invoke:
    - target: /diagnose
      required: false
      note: When a scenario fails for a reason that is not obvious
  output: templates/bdd-run.md
env:
  optional: [BDD_FILE_PATH]
self_check:
  - Did I execute every step for real, or reason about what would happen?
  - Did I record the observed value rather than the expected one?
  - Did I report failures as failures, whatever their cause?
  - Did I take one page at a time instead of reading ahead?
---

## Relationships

| Relation | Target | Required? | Notes |
|----------|--------|-----------|-------|
| comes-from | /bdd-generate | no | Run what was written |
| goes-to | /bdd-review | no | Assess coverage afterwards |
| can-invoke | /diagnose | no | Investigate a non-obvious failure |
| output | templates/bdd-run.md | yes | Execution report |

## Instructions

**Take one scenario at a time.** Call `get_bdd_scenario(page=1)`, carry that
scenario out completely, then request the next. Continue while `has_next` is
true. Do not read ahead — the pagination exists because a whole feature file
gets skimmed and reported on in aggregate, while a single scenario has to be
performed.

Each page arrives with the feature description and `Background`, so it can be
executed without anything else.

**For each scenario:**

1. **Prepare.** Establish the `Given` state for real. If it cannot be
   established, the scenario is blocked — say so, and do not report it as
   passed.
2. **Act.** Perform the `When` exactly as written: the actual call, the actual
   parameters.
3. **Check.** Compare each `Then` against what came back, one at a time.
4. **Record the observation, not the expectation.** Write down the value you
   received. When they match, that is a pass. When they do not, quote both.

**Report failures as failures.** A scenario that did not do what it said is a
failed scenario, whether the cause is the system, the environment or the
scenario itself. Softening it into a note is the single most damaging thing that
can happen here, because the whole point of executing these is to find out.

When a failure is not self-explanatory, invoke /diagnose rather than guessing.

Finish with counts — passed, failed, blocked — and the failures in full.
