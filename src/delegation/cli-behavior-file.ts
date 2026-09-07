import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export type TemporaryFileResult<T> = { ok: true; result: T } | { ok: false; reason: string };

/**
 * Writes `content` to a temporary `AGENTS.md` at `root`, runs `fn`, and
 * always removes the file — success, error thrown by `fn`, or refusal.
 *
 * Refuses instead of overwriting when a real `AGENTS.md` already exists:
 * that file belongs to the person, and an anonymous temporary one can't
 * erase real content (`SPEC-0019`, erros e casos-limite).
 */
export function withTemporaryAgentsFile<T>(root: string, content: string, fn: () => T): TemporaryFileResult<T> {
  const path = resolve(root, "AGENTS.md");
  if (existsSync(path)) {
    return { ok: false, reason: `refusing to overwrite an existing AGENTS.md at ${path}` };
  }
  writeFileSync(path, content);
  try {
    return { ok: true, result: fn() };
  } finally {
    unlinkSync(path);
  }
}
