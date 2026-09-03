import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PlannedItem } from "../src/approval/render";

/** Disposable root with evidence of target use. */
export function project(prefix = "crs-ap-"): string {
  const root = mkdtempSync(join(tmpdir(), prefix));
  writeFileSync(join(root, "package.json"), '{"name":"disposable"}\n');
  mkdirSync(join(root, ".claude"), { recursive: true });
  writeFileSync(join(root, ".claude", "settings.json"), "{}\n");
  return root;
}

export function fileTree(root: string): string[] {
  if (!existsSync(root)) return [];
  const output: string[] = [];
  const walk = (dir: string, prefix: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      output.push(rel);
      if (e.isDirectory()) walk(join(dir, e.name), rel);
    }
  };
  walk(root, "");
  return output.sort();
}

/** Injected context: declares presence or absence of a terminal on standard input. */
export function fixedContext(hasTerminal: boolean) {
  return { hasTerminal: () => hasTerminal };
}

/**
 * Injected decision source, synchronous by design: `ask` returns the
 * answer directly, without a promise, so `runSetup` doesn't need to
 * become async. Same pattern as `TraceSource` and the skills executor.
 */
export function fixedDecision(approved: boolean, received: PlannedItem[][] = []) {
  return {
    ask: (plan: PlannedItem[]): boolean => {
      received.push(plan);
      return approved;
    },
  };
}

/** Source that throws if called — used to prove no request happened. */
export function decisionThatThrowsIfCalled() {
  return {
    ask: (): boolean => {
      throw new Error("approval shouldn't have been requested");
    },
  };
}

/** Document-channel source: returns the text "standard input" would contain. */
export function fixedDocument(text: string) {
  return { hasTerminal: () => false, readDocument: () => text };
}
