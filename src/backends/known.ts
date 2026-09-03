/**
 * Agent backends with hands-off invocation capability demonstrated by real
 * execution — see `research/backends/hands-off-invocation.md`, SPEC-0008.
 *
 * The list is fixed in code, not discovered by probing `--help` in
 * production: fatia 1d corrected an earlier backlog conclusion, which had
 * only checked each CLI's top-level `--help` and missed `codex exec` and
 * `goose run`, both dedicated subcommands for the same capability.
 */
export const SUPPORTED_AGENT_BACKENDS = ["pi", "agy", "claude", "codex", "goose"] as const;

/**
 * Known candidates, supported and unsupported.
 *
 * `dsh` and `cursor-agent` are listed here so `doctor` can tell them apart
 * from backends that are genuinely absent (`FR-032`, `FR-033`) — present on
 * the machine, but without demonstrated hands-off invocation capability.
 */
export const KNOWN_AGENT_BACKENDS = [...SUPPORTED_AGENT_BACKENDS, "dsh", "cursor-agent"] as const;
