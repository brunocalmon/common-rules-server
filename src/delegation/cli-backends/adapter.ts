import type { AgentBrief } from "../brief.js";

/**
 * One backend's mapping from a briefing to real CLI arguments.
 *
 * `injectsBehaviorByFlag` and `supportsToolsAllowlist` are declared, not
 * probed — each was confirmed by real `--help` output during discovery
 * (`SPEC-0019`, `R-001`/`R-002`), the same way `SUPPORTED_AGENT_BACKENDS` is
 * a fixed list rather than something detected at runtime.
 */
export interface CliBackendAdapter {
  name: string;
  /** Builds the argument vector for a spawn, from the composed briefing. */
  buildArgs(brief: AgentBrief): string[];
  /** Whether behavior is injected via a native flag (`true`) or a temporary `AGENTS.md` (`false`). */
  injectsBehaviorByFlag: boolean;
  /** Whether the backend has a mechanism to restrict which tools it uses. */
  supportsToolsAllowlist: boolean;
}
