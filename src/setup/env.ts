import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import type { TargetEnvironment } from "../hooks/detect.js";

/**
 * Observes the project to feed detection.
 *
 * Isolated in its own module because it's the only part that touches the
 * filesystem: the decision itself receives the result as a parameter, and
 * that's what makes detection verifiable without depending on the machine.
 */
export function detectEnvironment(root: string = process.cwd()): TargetEnvironment {
  const dir = resolve(root, ".claude");
  if (!existsSync(dir)) return { hasClaudeCode: false, files: [] };
  const files = readdirSync(dir).map((f) => `.claude/${f}`);
  return { hasClaudeCode: true, files: [".claude/", ...files] };
}
