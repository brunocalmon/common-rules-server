[← Wiki Hub](../README.md)

---

# Coding Standards

Conventions that are not enforced automatically. Anything a formatter or linter
can enforce belongs in its configuration, not on this page — a rule that is
written down but not enforced is a rule that is followed inconsistently.

## Automated

| Concern | Tool | Configuration | Command |
|---|---|---|---|
| Formatting | <tool> | <path> | `<command>` |
| Linting | <tool> | <path> | `<command>` |
| Types | <tool> | <path> | `<command>` |

## Conventions

### Naming

<Project-specific naming that a linter cannot check.>

### Structure

<Where things go, and why.>

### Errors

<How failures are represented, propagated and logged.>

### Comments

Comments explain why, not what. A comment restating the code is a maintenance
liability; a comment recording a non-obvious reason is the most valuable line
in the file.

## Definition of done

- [ ] Behaviour covered by a test that fails without the change
- [ ] Build, tests and lint pass
- [ ] Documentation updated where behaviour or interfaces changed
- [ ] Reviewed by someone who did not write it


---

← Previous: [Architecture Decision Record](../architecture/adrs/ADR-TEMPLATE.md) · Next: [Testing Strategy](TESTING-STRATEGY-TEMPLATE.md) →
