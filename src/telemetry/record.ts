/**
 * One agent's telemetry entry — a discriminated union so a refused attempt
 * and a completed spawn can never be confused, and neither variant carries
 * a field for the other's shape.
 *
 * Deliberately absent from both variants: stdout, stderr, or any other
 * subprocess text (`SPEC-0020`, `PR-003`/`NFR-002`) — the fields here are
 * exactly what's needed to reconstruct what happened, structurally, never
 * what the subprocess said.
 */
export type AgentTelemetryEntry = {
  agent: string;
  backend: string | null;
  model: string | null;
  startedAt: string;
  durationMs: number;
} & (
  | { outcome: "refused"; stage: "tools" | "backend" | "gate" | "spawn"; reason: string }
  | { outcome: "ran"; exitCode: number }
);
