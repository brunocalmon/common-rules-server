import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { buildDefaultConfig } from "./schema.js";
import { mergeMissingKeys, parse, serialize } from "./yaml.js";

export const CONFIG_PATH = ".common-rules/config.yaml";

/** Creates `.common-rules/config.yaml` only when absent — never overwrites an existing file (FR-001, FR-005). */
export function ensureConfigFile(root: string): void {
  const full = join(root, CONFIG_PATH);
  if (existsSync(full)) return;
  const doc = buildDefaultConfig({ platform: () => process.platform });
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, serialize(doc));
}

/**
 * Backfills a key the current schema declares but an existing file omits,
 * preserving every present key/value and comment (FR-008, NFR-001, NFR-002).
 * Creates the file first when it's entirely absent, same as `ensureConfigFile`.
 */
export function backfillConfigFile(root: string): void {
  ensureConfigFile(root);
  const full = join(root, CONFIG_PATH);
  const current = readFileSync(full, "utf8");
  const document = parse(current);
  const defaults = buildDefaultConfig({ platform: () => process.platform });
  const changed = mergeMissingKeys(document, defaults);
  if (changed) writeFileSync(full, document.toString());
}
