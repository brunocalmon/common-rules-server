import type { TelemetryRecord } from "./store.js";

/** Renders a trace's telemetry record as text, one block per agent entry. */
export function renderTelemetry(record: TelemetryRecord): string {
  return record.agents
    .map((entry) => {
      const lines = [
        `## ${entry.agent}`,
        `backend: ${entry.backend ?? "none"}`,
        `model: ${entry.model ?? "none"}`,
        `startedAt: ${entry.startedAt}`,
        `duration: ${entry.durationMs}ms`,
      ];
      if (entry.outcome === "ran") {
        lines.push("outcome: ran", `exitCode: ${entry.exitCode}`);
      } else {
        lines.push("outcome: refused", `stage: ${entry.stage}`, `reason: ${entry.reason}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");
}
