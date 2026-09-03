import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Executor } from "./install.js";
import { buildSkillsAddArgs } from "./install.js";

/** The `common-rules` package's root, not the target project's. */
const packageRoot = (): string => resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Returns the local `skills` package binary, or null when absent. */
export function resolveSkillsBin(root: string = packageRoot()): string | null {
  const bin = resolve(root, "node_modules", "skills", "bin", "cli.mjs");
  return existsSync(bin) ? bin : null;
}

/**
 * Recognizes a skill name on a line of `--list`'s listing.
 *
 * The real CLI has no `--json` output for this enumeration: it's text
 * formatted for the terminal, with ANSI codes. Each skill's name lives on
 * its own line, four spaces after `│`; the description, on the next line,
 * lives six spaces in — the indentation difference is what tells the two
 * apart.
 */
function parseSkillNames(stdout: string): string[] {
  const withoutAnsi = stdout.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, "");
  const line = /^│ {4}([a-z0-9][\w.-]*)\s*$/gm;
  const names: string[] = [];
  for (const m of withoutAnsi.matchAll(line)) names.push(m[1]!);
  return names;
}

/**
 * Real executor for the `skills` installer, via subprocess.
 *
 * Without `--list`, returns only the exit code. With `--list`, a run that
 * ends in zero but recognizes no skill at all is treated as a failure —
 * the same principle as `AC-028`: never report zero skills installed as
 * success, even when it's the parsing that failed and not the installer.
 */
export function realSkillsExecutor(root: string = packageRoot()): Executor {
  const bin = resolveSkillsBin(root);
  return (args, cwd) => {
    if (bin === null) return null;
    const r = spawnSync(bin, args, { cwd, encoding: "utf8", timeout: 120_000 });
    if (r.error) return null;
    const status = r.status ?? 1;
    if (!args.includes("--list")) return { status };
    const skills = parseSkillNames(r.stdout ?? "");
    if (status === 0 && skills.length === 0) return { status: 1 };
    return { status, skills };
  };
}

/**
 * The command `realSkillsExecutor` would actually fire for `source`,
 * without running it — for the approval plan (fatia 1i, `PR-062`). `null`
 * when the binary doesn't exist, same convention as `Executor`.
 */
export function describeSkillsCommand(source: string, root: string = packageRoot()): { bin: string; args: string[] } | null {
  const bin = resolveSkillsBin(root);
  if (bin === null) return null;
  return { bin, args: buildSkillsAddArgs(source) };
}
