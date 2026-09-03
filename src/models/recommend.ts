import type { BackendResult } from "../backends/detect.js";
import { SUPPORTED_AGENT_BACKENDS } from "../backends/known.js";
import type { OllamaModel, OllamaSnapshot } from "./ollama.js";
import type { Capacity } from "./capacity.js";

export interface RecommendOverride {
  backend?: string;
  localModel?: string;
}

export interface Recommendation {
  backend: string | null;
  backendOverridden: boolean;
  localModel: string | null;
  localModelOverridden: boolean;
  freeBytesConsidered: number;
  report: string;
}

/** Deterministic by the order declared in `SUPPORTED_AGENT_BACKENDS` (FR-034). */
function recommendBackend(backends: BackendResult[]): string | null {
  for (const name of SUPPORTED_AGENT_BACKENDS) {
    const entry = backends.find((b) => b.name === name);
    if (entry?.present && entry.supported) return name;
  }
  return null;
}

/** The largest model whose size fits in free memory, "fits" is `<=` (FR-035). */
function recommendLocalModel(ollama: OllamaSnapshot, capacity: Capacity): OllamaModel | null {
  const fitting = ollama.models.filter((m) => m.sizeBytes <= capacity.freeBytes);
  if (fitting.length === 0) return null;
  return fitting.reduce((largest, current) => (current.sizeBytes > largest.sizeBytes ? current : largest));
}

function renderReport(params: {
  backend: string | null;
  backendOverridden: boolean;
  localModel: string | null;
  localModelOverridden: boolean;
  ollamaPresent: boolean;
  freeBytes: number;
}): string {
  const lines: string[] = [];
  if (params.backend === null) {
    lines.push("No supported backend present.");
  } else {
    lines.push(`Recommended backend: ${params.backend}${params.backendOverridden ? " (override)" : ""}`);
  }
  if (params.localModel === null) {
    lines.push(
      params.ollamaPresent
        ? "No local model fit in free memory."
        : "ollama was not found on this machine.",
    );
  } else {
    lines.push(`Recommended local model: ${params.localModel}${params.localModelOverridden ? " (override)" : ""}`);
  }
  lines.push(`Free memory considered: ${params.freeBytes} bytes. Cost and plan usage are not part of this calculation.`);
  return lines.join("\n");
}

/**
 * Pure function, no I/O — the caller already resolved `detectBackends`,
 * `listOllamaModels` and `readCapacity` beforehand (`DEC-041`).
 *
 * An override is never revalidated against presence or capacity
 * (`DEC-039`, `FR-036`): the human choice replaces the corresponding
 * calculation without further checking.
 */
export function recommend(
  backends: BackendResult[],
  ollama: OllamaSnapshot,
  capacity: Capacity,
  override: RecommendOverride = {},
): Recommendation {
  const calculatedBackend = recommendBackend(backends);
  const backendOverridden = override.backend !== undefined;
  const backend = backendOverridden ? (override.backend as string) : calculatedBackend;

  const calculatedModel = recommendLocalModel(ollama, capacity);
  const localModelOverridden = override.localModel !== undefined;
  const localModel = localModelOverridden ? (override.localModel as string) : (calculatedModel?.name ?? null);

  const report = renderReport({
    backend,
    backendOverridden,
    localModel,
    localModelOverridden,
    ollamaPresent: ollama.present,
    freeBytes: capacity.freeBytes,
  });

  return {
    backend,
    backendOverridden,
    localModel,
    localModelOverridden,
    freeBytesConsidered: capacity.freeBytes,
    report,
  };
}
