[← Wiki Hub](../README.md)

---

# Testing Strategy

457 tests. The distribution reflects a specific lesson: the previous suite passed
while placeholder resolution was entirely broken, because every test used
fixtures and none ran the code against the resources actually shipped.

## Levels

| Level | Verifies | Where |
|---|---|---|
| Unit | Parsing, resolution, config precedence | `test/util`, `test/service` |
| Functional | Services against a real temp project and a real git repo | `test/service` |
| Contract | The five tools as a client calls them | `test/test_mcp_server.py` |
| Kit integrity | Every shipped file, and the catalogue as a graph | `test/test_default_kit_integrity.py` |
| Acceptance | Agent-executed, against the running server | `agent_bdd.feature` |

## Tests that exist because something failed

| Test | Catches |
|---|---|
| `test_no_builtin_resource_leaks_an_unresolved_config_key` | [FND-001](../tracking/findings/FND-001.md) — the whole config layer inert |
| `test_human_co_author_trailer_is_preserved` | [FND-012](../tracking/findings/FND-012.md) — erasing a real person's credit |
| `test_body_is_not_truncated_by_a_horizontal_rule` | [FND-005](../tracking/findings/FND-005.md) — silent body truncation |
| `test_path_traversal_in_the_name_is_rejected` | [FND-002](../tracking/findings/FND-002.md) — writes outside the resources directory |
| `test_no_temporary_file_is_left_behind` | [FND-007](../tracking/findings/FND-007.md) — litter in the git directory |
| `test_no_pseudo_code_survives_in_the_kit` | Regression to the format this rewrite removed |

## Principles

**Run the real thing.** The git hook tests execute the generated shell script as
a subprocess and make an actual commit. Asserting on the script's text would only
prove it was written.

**Test the shipped content, not just the code.** The integrity suite parametrises
across every resource file, so a malformed resource fails by name.

**Expected values come from an independent source.** Contracts in
`agent_bdd.feature` were captured by calling the real tools and recording the
output, not by reading the implementation.


---

← Previous: [Development Guide](DEVELOPMENT-GUIDE.md) · Next: [Agent BDD](AGENT-BDD.md) →
