import type { BackendResult } from "../backends/detect.js";
import { SUPPORTED_AGENT_BACKENDS } from "../backends/known.js";
import type { OllamaModel, OllamaSnapshot } from "./ollama.js";
import type { Capacity } from "./capacity.js";
import type { ContextWindowReader } from "./context-window.js";
import type { ResolvedTaskType } from "./task-type.js";

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

/** Why no local model was recommended, when the reason is the context window (`AC-009`). */
interface WindowShortfall {
  required: number;
  largestAvailable: number | null;
}

interface LocalModelChoice {
  model: OllamaModel | null;
  shortfall: WindowShortfall | null;
}

/**
 * The largest model that fits in free memory and holds the required context
 * window.
 *
 * Memory comes first, and not only because `ollama list` already gives size
 * for free: reading a window costs one subprocess per model, so filtering by
 * what's already known keeps the cost proportional to the models that
 * actually compete (`DEC-004`, `AC-012`). A model whose window falls short
 * is dropped rather than ranked lower — it isn't a worse choice, it's an
 * unusable one (`DEC-003`).
 */
function recommendLocalModel(
  ollama: OllamaSnapshot,
  capacity: Capacity,
  requirement: ResolvedTaskType | undefined,
  readWindow: ContextWindowReader | undefined,
): LocalModelChoice {
  const fitting = ollama.models.filter((m) => m.sizeBytes <= capacity.freeBytes);
  if (fitting.length === 0) return { model: null, shortfall: null };

  const required = requirement?.contextWindowMin ?? null;
  if (required === null || readWindow === undefined) {
    return { model: largest(fitting), shortfall: null };
  }

  const windows = fitting.map((model) => ({ model, window: readWindow(model.name) }));
  const viable = windows.filter((entry) => entry.window !== null && entry.window >= required);
  if (viable.length === 0) {
    const known = windows.map((entry) => entry.window).filter((w): w is number => w !== null);
    return {
      model: null,
      shortfall: { required, largestAvailable: known.length > 0 ? Math.max(...known) : null },
    };
  }
  return { model: largest(viable.map((entry) => entry.model)), shortfall: null };
}

function largest(models: OllamaModel[]): OllamaModel {
  return models.reduce((biggest, current) => (current.sizeBytes > biggest.sizeBytes ? current : biggest));
}

function renderReport(params: {
  backend: string | null;
  backendOverridden: boolean;
  localModel: string | null;
  localModelOverridden: boolean;
  ollamaPresent: boolean;
  freeBytes: number;
  requirement?: ResolvedTaskType | undefined;
  shortfall?: WindowShortfall | null;
}): string {
  const lines: string[] = [];
  if (params.backend === null) {
    lines.push("No supported backend present.");
  } else {
    lines.push(`Recommended backend: ${params.backend}${params.backendOverridden ? " (override)" : ""}`);
  }
  if (params.localModel === null) {
    // The window shortfall gets its own sentence: "no local model fit"
    // would send whoever reads it looking at memory, which isn't the
    // constraint that actually rejected every candidate (`AC-009`).
    if (params.shortfall) {
      const largest = params.shortfall.largestAvailable;
      // "largest available" without naming the constraint reads as "the
      // largest on this machine", and a person who knows a bigger model is
      // installed concludes the tool is wrong. The candidates were already
      // narrowed by free memory, and the sentence has to say so.
      lines.push(
        `No local model holds the required context window of ${params.shortfall.required} tokens. ` +
          (largest === null
            ? "No candidate that fits in free memory declared a context window."
            : `Largest window among the models that fit in free memory: ${largest} tokens.`),
      );
    } else {
      lines.push(
        params.ollamaPresent
          ? "No local model fit in free memory."
          : "No local model available: ollama was not found on this machine.",
      );
    }
  } else {
    lines.push(`Recommended local model: ${params.localModel}${params.localModelOverridden ? " (override)" : ""}`);
  }
  if (params.requirement === undefined) {
    lines.push("No task type informed: no context window requirement was applied.");
  } else {
    const min = params.requirement.contextWindowMin;
    lines.push(
      `Task type considered: ${params.requirement.name}` +
        (min === null ? " (no context window requirement)." : `, requiring at least ${min} tokens of context.`),
    );
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
  requirement?: ResolvedTaskType,
  readWindow?: ContextWindowReader,
): Recommendation {
  const calculatedBackend = recommendBackend(backends);
  const backendOverridden = override.backend !== undefined;
  const backend = backendOverridden ? (override.backend as string) : calculatedBackend;

  // An override skips the window filter for the same reason it already
  // skips presence and capacity (`DEC-039`): the human choice replaces the
  // calculation instead of being audited by it.
  const localModelOverridden = override.localModel !== undefined;
  const choice = localModelOverridden
    ? { model: null, shortfall: null }
    : recommendLocalModel(ollama, capacity, requirement, readWindow);
  const localModel = localModelOverridden ? (override.localModel as string) : (choice.model?.name ?? null);

  const report = renderReport({
    backend,
    backendOverridden,
    localModel,
    localModelOverridden,
    ollamaPresent: ollama.present,
    freeBytes: capacity.freeBytes,
    requirement,
    shortfall: choice.shortfall,
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
