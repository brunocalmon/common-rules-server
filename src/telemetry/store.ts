import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AgentTelemetryEntry } from "./record.js";

/** Telemetry records, inside the managed directory like every other piece of state. */
export const TELEMETRY_DIR = ".maestro/telemetry";

export interface TelemetryRecord {
  trace: string;
  agents: AgentTelemetryEntry[];
}

function recordPath(root: string, trace: string): string {
  return join(root, TELEMETRY_DIR, `${trace}.json`);
}

/**
 * Reads a trace's telemetry record, or `null` when nothing was recorded.
 *
 * Malformed content also returns `null` rather than throwing — same
 * reading as `readApprovedPlan` (`SPEC-0016`): an unreadable artifact
 * proves nothing was recorded, which is the safe answer.
 */
export function readTelemetryRecord(root: string, trace: string): TelemetryRecord | null {
  const target = recordPath(root, trace);
  if (!existsSync(target)) return null;
  try {
    return JSON.parse(readFileSync(target, "utf8")) as TelemetryRecord;
  } catch {
    return null;
  }
}

/**
 * Appends one agent's entry to a trace's telemetry record.
 *
 * Creates the directory and the file when absent, and accumulates onto an
 * existing record without ever overwriting a prior entry — a plan with
 * several `cli` agents produces several entries under the same trace, in
 * the order they were processed (`FR-003`).
 */
export function appendTelemetryEntry(root: string, trace: string, entry: AgentTelemetryEntry): void {
  const existing = readTelemetryRecord(root, trace) ?? { trace, agents: [] };
  const updated: TelemetryRecord = { trace, agents: [...existing.agents, entry] };
  mkdirSync(join(root, TELEMETRY_DIR), { recursive: true });
  writeFileSync(recordPath(root, trace), `${JSON.stringify(updated, null, 2)}\n`);
}
