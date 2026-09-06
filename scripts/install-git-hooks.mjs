#!/usr/bin/env node
/**
 * Installs this repository's own git hooks from source control into
 * `.git/hooks/`, which git never tracks — a fresh clone has none of them
 * until something puts them there. Runs automatically via npm's
 * `prepare` lifecycle (fires after `npm install`), so cloning and
 * installing is what's needed, not a separate manual step someone has to
 * remember and can forget exactly the way the version bump itself was
 * forgotten.
 *
 * Copies rather than symlinks: a symlink into a worktree that later gets
 * removed (or a submodule/worktree setup) leaves `.git/hooks/` broken in
 * a way that's confusing to debug; a copy just needs re-running `npm
 * install` if the hook's source ever changes.
 */
import { chmodSync, copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = resolve(ROOT, "scripts", "git-hooks");

function gitDir() {
  try {
    return execFileSync("git", ["rev-parse", "--git-path", "hooks"], { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

const targetDir = gitDir();
if (!targetDir) {
  // Not a git checkout (e.g. installed as a dependency) — nothing to hook into.
  process.exit(0);
}

const target = resolve(ROOT, targetDir);
mkdirSync(target, { recursive: true });

for (const name of readdirSync(SOURCE_DIR)) {
  const dest = resolve(target, name);
  copyFileSync(resolve(SOURCE_DIR, name), dest);
  chmodSync(dest, 0o755);
  console.log(`git hook installed: ${name}`);
}
