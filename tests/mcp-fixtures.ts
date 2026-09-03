import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Creates a disposable root that passes for a project and has target evidence. */
export function disposableProject(prefix = "crs-"): string {
  const root = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(join(root, ".claude"), { recursive: true });
  writeFileSync(join(root, ".claude", "settings.json"), "{}\n");
  writeFileSync(join(root, "package.json"), '{"name":"disposable"}\n');
  return root;
}

/** Creates a directory with no project marker at all. */
export function emptyDirectory(): string {
  return mkdtempSync(join(tmpdir(), "crs-empty-"));
}

/** Recursively lists the relative paths existing under a root. */
export function fileTree(root: string): string[] {
  if (!existsSync(root)) return [];
  const output: string[] = [];
  const walk = (dir: string, prefix: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      output.push(rel);
      if (entry.isDirectory()) walk(join(dir, entry.name), rel);
    }
  };
  walk(root, "");
  return output.sort();
}
