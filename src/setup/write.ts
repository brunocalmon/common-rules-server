import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Settings } from "../hooks/claude-code.js";
import type { InstallRecord } from "./record.js";

/**
 * Writes the target's configuration, preserving what isn't ours.
 *
 * Third-party keys in the file survive, and within `hooks` only the
 * events this tool manages get replaced. Overwriting the whole file would
 * destroy an adjustment the person made, which section 7 requires preserving.
 */
export function writeSettings(root: string, relPath: string, settings: Settings): string {
  const target = resolve(root, relPath);
  mkdirSync(dirname(target), { recursive: true });

  let current: Record<string, unknown> = {};
  if (existsSync(target)) {
    try {
      current = JSON.parse(readFileSync(target, "utf8")) as Record<string, unknown>;
    } catch {
      // An unreadable file is treated as absent, but never blindly erased.
      current = {};
    }
  }

  const currentHooks = (current["hooks"] ?? {}) as Record<string, unknown>;
  const merged = { ...current, hooks: { ...currentHooks, ...settings.hooks } };
  writeFileSync(target, `${JSON.stringify(merged, null, 2)}\n`);
  return relPath;
}

/** Writes the installation record inside the project. */
export function writeRecordFile(root: string, relPath: string, record: InstallRecord): string {
  const target = resolve(root, relPath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(record, null, 2)}\n`);
  return relPath;
}

/** Reads the previous record, when it exists. */
export function readRecordFile(root: string, relPath: string): InstallRecord | null {
  const target = resolve(root, relPath);
  if (!existsSync(target)) return null;
  try {
    return JSON.parse(readFileSync(target, "utf8")) as InstallRecord;
  } catch {
    return null;
  }
}
