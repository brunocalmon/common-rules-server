[← Wiki Hub](../README.md)

---

# Rollback Playbook

**Applies to:** the refactor from pseudo-code rules to the unified resource model
**Risk:** Low — the previous state is a tagged commit

## When to use this

The new server misbehaves in a way that blocks work and cannot be fixed forward
quickly.

## Before you start

- [ ] Note what failed, with output — the point of rolling back is to buy time
      to fix it, and that needs evidence
- [ ] Confirm nothing uncommitted is worth keeping

## Rolling back

| # | Action | Command |
|---|---|---|
| 1 | Find the pre-refactor state | `git log --oneline main` |
| 2 | Return to it | `git checkout <pre-refactor-sha>` |
| 3 | Reinstall | `uv sync --extra test` |
| 4 | Verify | `PYTHONPATH=src uv run pytest` |

To keep the branch but drop the change, revert the merge commit rather than
resetting a shared branch.

## Undoing the project-level effects

`setup_config` writes outside the package. Removing the server does not remove
these, and each undoes independently:

| Artefact | Undo |
|---|---|
| `.common-rules-server/` | Delete the directory |
| `.git/hooks/commit-msg` | Delete it; restore `commit-msg.pre-common-rules` if present |
| Editor rules file | Delete the block between the `BEGIN`/`END common-rules` markers |
| Companion MCP entries | Only present if explicitly permitted; a `.backup` sits beside the file |

## Verification

The old server exposes `get_system_rules`; the new one exposes `get_context`.
Whichever the editor lists tells you which is running.

## If it goes wrong

The refactor deleted the pseudo-code rules. They exist in git history — recover
individual files with `git show <sha>:<path>` rather than reverting wholesale.


---

← Previous: [Agent BDD](../engineering/AGENT-BDD.md) · Next: [Setup Guide](../onboarding/SETUP-GUIDE.md) →
