import type { AgentProfile } from "../config/schema.js";
import type { BackendResult } from "../backends/detect.js";
import { SUPPORTED_AGENT_BACKENDS } from "../backends/known.js";

export type BackendSelection = { ok: true; backend: string } | { ok: false; reason: string };

/**
 * Chooses which of the five supported backends runs a `runtime: cli` agent.
 *
 * Absent `execution.cli_backend`, the first backend present in
 * `SUPPORTED_AGENT_BACKENDS`'s fixed order wins — same fallback the rest of
 * the project already uses for "nothing declared" (`SPEC-0019`, `FR-004`).
 */
export function selectBackend(agent: AgentProfile, detected: readonly BackendResult[]): BackendSelection {
  const present = new Set(detected.filter((b) => b.present).map((b) => b.name));
  const declared = agent.execution.cli_backend;

  if (declared === undefined) {
    const first = SUPPORTED_AGENT_BACKENDS.find((name) => present.has(name));
    if (first === undefined) return { ok: false, reason: "no supported CLI backend is present in this environment" };
    return { ok: true, backend: first };
  }

  if (present.has(declared.value)) return { ok: true, backend: declared.value };

  if (declared.mode === "required") {
    return { ok: false, reason: `execution.cli_backend "${declared.value}" is required but not present in this environment` };
  }

  const fallback = SUPPORTED_AGENT_BACKENDS.find((name) => present.has(name));
  if (fallback === undefined) {
    return { ok: false, reason: "no supported CLI backend is present in this environment" };
  }
  return { ok: true, backend: fallback };
}
