[← Wiki Hub](../README.md)

---

# Testing Strategy

## Levels

| Level | Verifies | Speed | When it runs |
|---|---|---|---|
| Unit | One unit in isolation | Fast | Every save |
| Integration | Units against real collaborators | Medium | Every push |
| Acceptance | Behaviour from outside | Slow | Before merge |

## What makes a test worth keeping

A test earns its place by failing when the behaviour breaks and passing
otherwise. Two failure modes to watch for:

- **Tautological.** The assertion recomputes the expected value the way the code
  does, so it passes whatever the code does.
- **Implementation-coupled.** Mocking internals or asserting on private state,
  so it fails on refactors and passes on real breakage.

Expected values should come from an independent source: a worked example, a
specification, a hand-computed result.

## Coverage

Coverage is a weak signal, useful for finding untested areas and useless as a
target. Fully covered code can be untested in every way that matters.

| Measure | Target | Rationale |
|---|---|---|

## Commands

| Purpose | Command |
|---|---|
| All tests | `<command>` |
| Coverage | `<command>` |


---

← Previous: [Coding Standards](CODING-STANDARDS-TEMPLATE.md) · Next: [Pull Request Template](PR-TEMPLATE.md) →
