import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Executor } from "./install.js";
import { buildSpecsfyInstallArgs } from "./install.js";

/** The `common-rules` package's root, not the target project's. */
const packageRoot = (): string => resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Returns the local `@promovaweb/specsfy` package binary, or null when absent. */
export function resolveSpecsfyBin(root: string = packageRoot()): string | null {
  const bin = resolve(root, "node_modules", "@promovaweb", "specsfy", "bin", "specsfy.cjs");
  return existsSync(bin) ? bin : null;
}

interface SpecsfyJson {
  changed?: number;
  paths?: string[];
}

/**
 * Real executor for Specsfy's project installer, via subprocess.
 *
 * Unlike `skills`, the output is stable JSON: `{"changed", "paths"}`.
 * Output that doesn't parse as JSON, or a non-zero status, is a failure —
 * never silent success.
 */
export function realSpecsfyExecutor(root: string = packageRoot()): Executor {
  const bin = resolveSpecsfyBin(root);
  return (targetRoot) => {
    if (bin === null) return null;
    const r = spawnSync(bin, buildSpecsfyInstallArgs(targetRoot), {
      cwd: targetRoot,
      encoding: "utf8",
      timeout: 120_000,
    });
    if (r.error) return null;
    const status = r.status ?? 1;
    if (status !== 0) return { status };
    try {
      const json = JSON.parse(r.stdout ?? "") as SpecsfyJson;
      return { status, changed: json.changed ?? 0, paths: json.paths ?? [] };
    } catch {
      return { status: 1 };
    }
  };
}

/**
 * The command `realSpecsfyExecutor` would actually fire for `projectRoot`,
 * without running anything — for the approval plan (fatia 1i, `PR-062`).
 * `null` when the binary doesn't exist, same convention as `Executor`.
 * `pkgRoot` is the `common-rules` package's root (to resolve the binary),
 * distinct from `projectRoot` (the target project, which goes into the
 * argv via `--project`) — the same distinction
 * `realSpecsfyExecutor(root)`/`(targetRoot) => ...` already made.
 */
export function describeSpecsfyCommand(
  projectRoot: string,
  pkgRoot: string = packageRoot(),
): { bin: string; args: string[] } | null {
  const bin = resolveSpecsfyBin(pkgRoot);
  if (bin === null) return null;
  return { bin, args: buildSpecsfyInstallArgs(projectRoot) };
}
