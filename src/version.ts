import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// The compiled module lives in dist/, and the manifest sits one level up —
// both in the repository and in the published package, since `files` only
// includes `dist`.
const defaultManifestPath = (): string =>
  resolve(dirname(fileURLToPath(import.meta.url)), "..", "package.json");

/**
 * Returns the version declared in the manifest, without printing it.
 *
 * Separating reading from presentation is what lets the value be verified
 * without capturing terminal output; the command-line dispatcher is what
 * prints it.
 *
 * The path is injectable so the test doesn't depend on where the manifest
 * really sits on the machine that runs it.
 */
export function readVersion(manifestPath: string = defaultManifestPath()): string {
  const raw = readFileSync(manifestPath, "utf8");
  const version: unknown = (JSON.parse(raw) as Record<string, unknown>)["version"];
  if (typeof version !== "string" || version.length === 0) {
    throw new Error(`the manifest at ${manifestPath} doesn't declare a usable version`);
  }
  return version;
}
