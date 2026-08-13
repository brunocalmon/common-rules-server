[← Wiki Hub](../README.md)

---

# Roadmap

**Last updated:** 2026-08-08
**Workflow:** [Development Workflow](../../template/tracking/WORKFLOW.md)

## Delivered

| Epic | Outcome | Status | Tickets |
|---|---|---|---|
| [EPC-001](epics/EPC-001.md) | Foundation — unified resource model | Done | 4/4 |
| [EPC-002](epics/EPC-002.md) | Default kit | Done | 4/4 |
| [EPC-003](epics/EPC-003.md) | Active orchestration | Done | 3/3 |
| [EPC-004](epics/EPC-004.md) | Agent BDD framework | Done | 3/3 |
| [EPC-006](epics/EPC-006.md) | Enforcement and portability | Done | 5/5 |
| [EPC-005](epics/EPC-005.md) | Quality and documentation | Done | 4/4 |

## Open findings

Problems recorded during the rebuild and deliberately not fixed, so that the
change under review stayed the change that was planned.

| Finding | Summary | Severity |
|---|---|---|

## Resolved findings

Defects found in the previous implementation, and one found in this one.

| Finding | Summary | Severity |
|---|---|---|
| [FND-013](findings/FND-013.md) | Companion install path is undocumented | Low |
| [FND-001](findings/FND-001.md) | Placeholder substitution never worked | Critical |
| [FND-002](findings/FND-002.md) | create_resource collided kinds and did not sanitise names | High |
| [FND-003](findings/FND-003.md) | get_context returned a flat list | High |
| [FND-004](findings/FND-004.md) | get_resource omitted the output template | Medium |
| [FND-005](findings/FND-005.md) | Frontmatter regex truncated resource bodies | Medium |
| [FND-006](findings/FND-006.md) | Companion installer wrote invented commands into shared editor config | High |
| [FND-007](findings/FND-007.md) | Commit hook was fragile in several ways | Medium |
| [FND-008](findings/FND-008.md) | Gherkin reader missed outlines and dropped Background | Medium |
| [FND-009](findings/FND-009.md) | Configuration was written without explanations | High |
| [FND-010](findings/FND-010.md) | Documentation template was untranslated with broken navigation | Medium |
| [FND-011](findings/FND-011.md) | Server identified itself by editor name | Low |
| [FND-012](findings/FND-012.md) | Co-author filter erased human authorship | Critical |
| [FND-015](findings/FND-015.md) | Automations were guidance, not enforcement | High |
| [FND-016](findings/FND-016.md) | Antigravity was detected by state directories, not its config root | Medium |
| [FND-017](findings/FND-017.md) | Hook escaping was consumed twice, so every guard allowed everything | Critical |
| [FND-018](findings/FND-018.md) | Guards fired on ordinary commands | High |
| [FND-019](findings/FND-019.md) | Exported resources named a template they could not reach | Medium |
| [FND-020](findings/FND-020.md) | The post-edit hook ran a whole-project lint on every edit | Medium |
| [FND-021](findings/FND-021.md) | Syncing erased the guidance setup had just written | Critical |
| [FND-022](findings/FND-022.md) | An f-string backslash broke the oldest supported Python | Low |
| [FND-023](findings/FND-023.md) | The wiki generator destroyed content it did not own | Critical |
| [FND-024](findings/FND-024.md) | Acceptance scenarios asserted counts the kit no longer had | Medium |
| [FND-025](findings/FND-025.md) | Exported resources named tools that were not running | Medium |
| [FND-026](findings/FND-026.md) | A switched-off resource reported as one that does not exist | Medium |
| [FND-027](findings/FND-027.md) | A relative project root produced a blank project name | Low |
| [FND-014](findings/FND-014.md) | CI workflow verified against the new layout | Medium |

## Progress

| Status | Count |
|---|---|
| Done | 23 |
| In Progress | 0 |
| Backlog | 0 |
| Open findings | 0 |


---

← Previous: [Setup Guide](../onboarding/SETUP-GUIDE.md) · Next: [EPC-001 Foundation — unified resource model](epics/EPC-001.md) →
