import type { CliBackendAdapter } from "./cli-backends/adapter.js";
import type { PropertyMode } from "../config/schema.js";

export type ToolsSupportResult = { ok: true } | { ok: false; reason: string };

/**
 * `capability.tools` `required` is binding (`SPEC-0015`, `D6`; `PR-001`) —
 * a backend without an allowlist mechanism can't honor it, so it's refused
 * rather than run with broader access than declared.
 */
export function checkToolsSupport(tools: readonly string[], mode: PropertyMode, adapter: CliBackendAdapter): ToolsSupportResult {
  if (tools.length === 0) return { ok: true };
  if (mode === "required" && !adapter.supportsToolsAllowlist) {
    return {
      ok: false,
      reason: `backend "${adapter.name}" has no tools allowlist mechanism, and capability.tools is required — refusing rather than running with broader access than declared`,
    };
  }
  return { ok: true };
}
