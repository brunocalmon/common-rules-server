#!/usr/bin/env node
/**
 * Forces a version bump whenever the shipped source changed since the
 * current version number was last recorded.
 *
 * Comparing `package.json`'s version field alone catches nothing: it's
 * possible to edit `src/`, forget to bump, and push anyway — exactly what
 * happened across three fix commits that all landed as 1.0.0. This instead
 * fingerprints every file under `src/` and `resources/` (the two
 * directories that actually ship — `dist/` is generated from `src/`,
 * `tests/` verifies behavior but isn't part of the delivered package) and
 * compares that fingerprint against the one recorded for the version
 * currently in `package.json`. A mismatch means the source moved without
 * the version moving with it, and the build refuses rather than silently
 * shipping a build nobody can distinguish from the last one.
 *
 * Bumping the version and rerunning is what accepts the new fingerprint:
 * there's no separate "approve" step, because the version number is
 * already the signal that a change was deliberate.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = resolve(ROOT, ".version-checksum.json");
const CHECKSUM_DIRS = ["src", "resources"];

function collectFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function computeChecksum() {
  const files = CHECKSUM_DIRS.flatMap((d) => collectFiles(resolve(ROOT, d))).sort();
  const hash = createHash("sha256");
  for (const file of files) {
    // The relative path enters the hash too — renaming or moving a file
    // with identical content is still a change worth a version bump.
    hash.update(relative(ROOT, file));
    hash.update(readFileSync(file));
  }
  return hash.digest("hex");
}

function readManifest() {
  if (!existsSync(MANIFEST_PATH)) return null;
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  } catch {
    return null;
  }
}

const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
const checksum = computeChecksum();
const manifest = readManifest();

if (manifest && manifest.version === pkg.version && manifest.checksum !== checksum) {
  console.error(
    `error: src/ or resources/ changed since version ${pkg.version} was last recorded ` +
      `(${manifest.checksum.slice(0, 12)}… → ${checksum.slice(0, 12)}…).\n` +
      "Bump the version before building — at minimum a patch:\n" +
      "  npm version patch --no-git-tag-version\n" +
      "then rerun the build; that records the new checksum against the new version.",
  );
  process.exit(1);
}

writeFileSync(MANIFEST_PATH, `${JSON.stringify({ version: pkg.version, checksum }, null, 2)}\n`);
if (!manifest || manifest.version !== pkg.version) {
  console.log(`version-checksum: recorded ${pkg.version} → ${checksum.slice(0, 12)}…`);
}
