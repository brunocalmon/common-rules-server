[← Wiki Hub](../README.md)

---

# Pull Request Template

Copy into `.github/pull_request_template.md`.

```markdown
## What and why

<What changes, and the problem it solves. Link the ticket.>

## How

<Approach, and anything a reviewer would otherwise have to reverse-engineer.>

## Alternatives considered

<What else was tried or rejected, and why. Omit if genuinely obvious.>

## Verification

- [ ] Tests added or updated, and they fail without this change
- [ ] Build, tests and lint pass locally
- [ ] Documentation updated where behaviour or interfaces changed
- [ ] Tracker updated

## Risk

<What could break, and how it would be noticed. "None" is rarely true.>

## Rollback

<How to undo this if it goes wrong.>
```


---

← Previous: [Testing Strategy](TESTING-STRATEGY-TEMPLATE.md) · Next: [Operational Playbook](../operations/PLAYBOOK-TEMPLATE.md) →
