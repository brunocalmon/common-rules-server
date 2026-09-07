import { execFileSync } from "node:child_process";

/**
 * Resolution source, injected in the same pattern as `OllamaEnvironment` —
 * the suite never depends on the `ollama` of whoever runs it, and the
 * failure path is exercisable without uninstalling anything.
 */
export interface ContextWindowEnvironment {
  show(model: string): string;
}

/** The line `ollama show` prints for the window, e.g. `    context length      131072`. */
const CONTEXT_LENGTH = /^\s*context length\s+(\d+)\s*$/im;

/**
 * Extracts the context window from `ollama show` output.
 *
 * Returns `null` when the output doesn't declare one — never `0`. A zero
 * would compare as "smaller than any requirement" and silently disqualify
 * the model for the wrong reason; absence has to stay readable as absence
 * (`FR-001`, `AC-002`).
 */
export function parseContextLength(output: string): number | null {
  const match = CONTEXT_LENGTH.exec(output);
  if (match === null) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Reads one model's context window, or `null` when it can't be determined. */
export type ContextWindowReader = (model: string) => number | null;

/**
 * Builds a reader over an injected environment.
 *
 * A failing command is absence, not an exception: a model that vanished
 * between `ollama list` and `ollama show`, or an `ollama` that errors for
 * one entry, must not take down the whole recommendation — the other
 * candidates are still perfectly answerable (`AC-003`).
 */
export function contextWindowReader(env: ContextWindowEnvironment): ContextWindowReader {
  return (model) => {
    try {
      return parseContextLength(env.show(model));
    } catch {
      return null;
    }
  };
}

export function realContextWindowEnvironment(): ContextWindowEnvironment {
  return {
    show: (model) => execFileSync("ollama", ["show", model], { encoding: "utf8" }),
  };
}

export function realContextWindowReader(): ContextWindowReader {
  return contextWindowReader(realContextWindowEnvironment());
}
