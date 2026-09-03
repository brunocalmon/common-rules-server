import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { STACK_LABEL_TO_PROJECT_KEY } from "./schema.js";
import { parse } from "./yaml.js";
import { CONFIG_PATH } from "./write.js";

const STACK_PATH = ".specsfy/STACK.md";
const BLOCK = /<!-- specsfy:stack:start -->([\s\S]*?)<!-- specsfy:stack:end -->/;
const ROW = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|.*\|$/;

function readMappedFields(stackContent: string): Record<string, string> {
  const block = BLOCK.exec(stackContent)?.[1] ?? "";
  const fields: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const match = ROW.exec(line.trim());
    if (!match) continue;
    const label = match[1];
    const technology = match[2];
    if (label === undefined || technology === undefined) continue;
    const key = STACK_LABEL_TO_PROJECT_KEY[label];
    if (key) fields[key] = technology;
  }
  return fields;
}

/**
 * Syncs `project.*` from `.specsfy/STACK.md`'s machine-readable table
 * (DEC-003) — never touches `language`, `system` or `git`, and never writes
 * when `STACK.md` is absent (FR-007) or when nothing changed (FR-005, NFR-002).
 */
export function syncProjectFromStack(root: string): void {
  const stackFull = join(root, STACK_PATH);
  if (!existsSync(stackFull)) return;

  const fields = readMappedFields(readFileSync(stackFull, "utf8"));
  if (Object.keys(fields).length === 0) return;

  const configFull = join(root, CONFIG_PATH);
  if (!existsSync(configFull)) return;

  const document = parse(readFileSync(configFull, "utf8"));
  let changed = false;
  for (const [key, value] of Object.entries(fields)) {
    if (document.getIn(["project", key]) !== value) {
      document.setIn(["project", key], value);
      changed = true;
    }
  }
  if (changed) writeFileSync(configFull, document.toString());
}
