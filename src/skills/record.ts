import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { inspectSkills } from "./inventory.js";

/** Lockfile the installer itself writes, at the project root. */
export const LOCK_PATH = "skills-lock.json";

export interface LockEntry {
  source: string;
  sourceType: string;
  skillPath: string;
  computedHash: string;
}

export interface SkillRecordEntry extends LockEntry {
  name: string;
}

export interface SkillReportRow {
  name: string;
  origin: string;
  present: boolean;
  diverged: boolean;
}

export interface SkillReport {
  results: SkillReportRow[];
  exitCode: number;
  note: string;
}

/**
 * States the real scope of the guarantee.
 *
 * The lockfile records what was obtained, not what should be obtained:
 * there's no commit reference or set version. Saying this in the report
 * keeps the tool from promising more than it delivers.
 */
export const GUARANTEE_NOTE =
  "The recorded source doesn't pin the obtained reference: the installer fetches the tip on every run, " +
  "and this report exists to make that drift visible.";

/** Reads the installer's lockfile. Returns null when it doesn't exist. */
export function readLock(root: string): Record<string, LockEntry> | null {
  const path = join(root, LOCK_PATH);
  if (!existsSync(path)) return null;
  const raw = JSON.parse(readFileSync(path, "utf8")) as { skills?: Record<string, LockEntry> };
  const skills = raw.skills ?? {};
  return Object.keys(skills).length > 0 ? skills : null;
}

/**
 * Converts the lockfile into project record entries.
 *
 * Provenance is read, never recomputed: the installer already computes a
 * hash per skill, and recomputing would create two truths about the same
 * content.
 */
export function toRecordEntries(lock: Record<string, LockEntry> | null): SkillRecordEntry[] {
  if (!lock) return [];
  return Object.entries(lock).map(([name, e]) => ({ name, ...e }));
}

/**
 * Compares what's recorded against what's present, without changing
 * anything.
 *
 * This is the function `doctor` consumes, and that's why it never writes:
 * diagnosing and repairing are distinct commands, and destructive repair
 * is out of scope.
 */
export function reportSkills(root: string): SkillReport {
  const entries = toRecordEntries(readLock(root));
  const present = new Set(inspectSkills(root).dirs);
  const results = entries.map((e) => {
    const isPresent = present.has(e.name);
    return { name: e.name, origin: e.source, present: isPresent, diverged: !isPresent };
  });
  return {
    results,
    exitCode: results.some((r) => r.diverged) ? 1 : 0,
    note: GUARANTEE_NOTE,
  };
}
