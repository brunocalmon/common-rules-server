[← Wiki Hub](../README.md)

---

# Agent BDD

Acceptance scenarios written in Gherkin and executed by an agent against the
running system. No test runner is involved: the agent performs the steps by
calling the real tools and compares what comes back with what the scenario says.

## Why pagination

`get_bdd_scenario(page)` returns one scenario at a time.

An agent given a whole feature file skims it and reports in aggregate — "all 37
scenarios pass" — without having carried any of them out. Given one scenario, it
has to perform those steps and state what it observed before it can ask for the
next.

Each page is self-contained: the feature description and `Background` travel with
every scenario, because a scenario without its setup is not executable.

## Running

```
get_bdd_scenario(page=1)
  → perform Given, When, check each Then
  → record the observed value
  → has_next ? page + 1 : summarise
```

Or invoke `/bdd-run`, which follows this loop and reports against the template.

## Writing

Invoke `/bdd-generate`, which requires `/grill-me` first. That edge is required
rather than suggested: scenarios written against an assumed contract encode the
assumption and then pass, which manufactures confidence instead of testing
anything.

**Contracts must be exact.** Every field, every value, as the real system
produces them. No abbreviation, no `...`, no plausible-looking values, no mocks.
A scenario asserting an approximated contract passes against a system that is
wrong and fails against one that is right.

Where the real shape is unknown, call the real thing and record what it returns.
Every contract in this project's feature file was captured that way.

## Coverage

37 scenarios across all five tools, plus commit authorship, editor guidance and
companion detection. Happy paths, boundaries, errors, and the security cases —
path traversal, and preserving human co-authorship.

## Reviewing

`/bdd-review` judges the suite against the system's real surface rather than
against itself: which entry points are uncovered, which assertions approximate a
contract, and whether the balance is weighted towards happy paths.


---

← Previous: [Testing Strategy](TESTING-STRATEGY.md) · Next: [Rollback Playbook](../operations/ROLLBACK-PLAYBOOK.md) →
