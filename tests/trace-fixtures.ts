import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Recognizable instant, far from the epoch, so passing by accident is impossible. */
export const FIXED_INSTANT = "2026-08-29T17:45:00.000Z";
export const FIXED_ID = "0123456789abcdef0123456789abcdef";
export const EPOCH = "1970-01-01T00:00:00.000Z";

/** Injected source, predictable by construction. */
export function fixedSource(id = FIXED_ID, instant = FIXED_INSTANT) {
  return { now: () => instant, id: () => id };
}

/** Disposable root with evidence of target use. */
export function project(prefix = "crs-tr-"): string {
  const root = mkdtempSync(join(tmpdir(), prefix));
  writeFileSync(join(root, "package.json"), '{"name":"disposable"}\n');
  mkdirSync(join(root, ".claude"), { recursive: true });
  writeFileSync(join(root, ".claude", "settings.json"), "{}\n");
  return root;
}

/** Writes a record by hand, to exercise reading without running setup. */
export function writeRecord(root: string, content: Record<string, unknown>): void {
  mkdirSync(join(root, ".common-rules"), { recursive: true });
  writeFileSync(join(root, ".common-rules", "install.json"), JSON.stringify(content, null, 2));
}

/** Record in the shape the version prior to this fatia used to write. */
export function oldRecord(): Record<string, unknown> {
  return {
    target: "claude-code",
    version: "1.0.0",
    hooks: [{ name: "guard-secrets", target: ".claude/settings.json", version: "1.0.0", installedAt: EPOCH, event: "PreToolUse" }],
  };
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
