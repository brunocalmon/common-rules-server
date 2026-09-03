import { readFileSync } from "node:fs";
import type { ApprovalChannel } from "./context.js";
import { renderPlan, type PlannedItem } from "./render.js";
import type { DependencyCommandItem } from "./plan.js";

/** Decision source, synchronous by design — see `TraceSource` for the same pattern. */
export interface DecisionSource {
  ask(hooks: PlannedItem[], commands: DependencyCommandItem[]): boolean;
}

/** Low level: gets the bytes the decision would come from. Replaceable without swapping the whole `DecisionSource`. */
export interface StdinReader {
  read(): string;
}

/** Real, synchronous reader. `readFileSync(0, ...)` blocks until EOF. */
export const defaultStdinReader: StdinReader = { read: () => readFileSync(0, "utf8") };

/**
 * Document channel: reads JSON from standard input and accepts only `approved: true`.
 *
 * Empty input, non-JSON text, and JSON in an unexpected shape all converge
 * to a refusal, never to an exception — the caller doesn't need to tell
 * the three apart.
 */
function documentSource(stdin: StdinReader): DecisionSource {
  return {
    ask: () => {
      const raw = stdin.read().trim();
      if (raw.length === 0) return false;
      let value: unknown;
      try {
        value = JSON.parse(raw);
      } catch {
        return false;
      }
      if (typeof value !== "object" || value === null) return false;
      return (value as { approved?: unknown }).approved === true;
    },
  };
}

/**
 * Interactive channel: presents the plan and reads the answer from standard input.
 *
 * Uses the same `StdinReader` as the document channel; reading a short
 * answer via `readFileSync(0)` is a deliberate simplification of this
 * fatia, with no new dependency for line-by-line reading.
 */
function interactiveSource(stdin: StdinReader): DecisionSource {
  return {
    ask: (hooks, commands) => {
      process.stdout.write(renderPlan(hooks, commands).text);
      process.stdout.write("\nApprove? [y/N] ");
      const answer = stdin.read().trim().toLowerCase();
      return answer === "y" || answer === "yes";
    },
  };
}

/** Builds the real source for the chosen channel. */
export function realSource(channel: ApprovalChannel, stdin: StdinReader = defaultStdinReader): DecisionSource {
  return channel === "interactive" ? interactiveSource(stdin) : documentSource(stdin);
}

export interface ApprovalResult {
  approved: boolean;
  reason?: string;
}

/**
 * Interprets a source's result, treating an exception as a refusal.
 *
 * No answer means refusal, never consent: a source that throws can't, by
 * an implementation accident, unlock the write.
 */
export function interpret(source: DecisionSource, hooks: PlannedItem[], commands: DependencyCommandItem[]): ApprovalResult {
  try {
    return source.ask(hooks, commands) ? { approved: true } : { approved: false, reason: "refused" };
  } catch {
    return { approved: false, reason: "the decision source failed" };
  }
}
