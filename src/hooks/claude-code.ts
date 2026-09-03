import type { CanonicalEvent, Hook } from "./source.js";

/** Event name in the format the target uses. */
export type TargetEvent = "PreToolUse" | "PostToolUse" | "Stop";

export interface TranslatedHook {
  name: string;
  event: TargetEvent;
  blocking: boolean;
  script: string;
}

const EVENT_MAP: Record<CanonicalEvent, TargetEvent> = {
  "before-shell": "PreToolUse",
  "after-file-edit": "PostToolUse",
  stop: "Stop",
};

/**
 * Converts a canonical hook to the target's format.
 *
 * Returns a structure and doesn't write a file. This separation is
 * deliberate: it's what lets the script's fidelity be verified without
 * touching disk. In v0.2.8, escaping and writing lived on the same path,
 * the escape was consumed twice, and every guard started allowing
 * anything — a defect that survived review because the generated file
 * looked correct.
 */
export function translateForClaudeCode(hook: Hook): TranslatedHook {
  return {
    name: hook.name,
    event: EVENT_MAP[hook.event],
    blocking: hook.blocking,
    // The fragment passes through without any transformation, embedded
    // between preamble and postamble. Escaping here and again during
    // serialization is the defect this fatia exists to avoid.
    script: wrap(hook),
  };
}

/**
 * Wraps the fragment in what makes it executable.
 *
 * The block inside the Markdown isn't a complete script: it reads
 * variables someone needs to supply and communicates via `decision` and
 * `message`, which someone needs to emit. The `guard-destructive`
 * fragment ends at the last `fi` without printing anything — alone, it
 * would never block.
 */
function wrap(hook: Hook): string {
  return [PREAMBLE, `HOOK_EVENT=${JSON.stringify(hook.event)}`, "", FRAGMENT_START + hook.script + FRAGMENT_END, POSTAMBLE].join("\n");
}

/** Extracts the fragment back out, to check the round trip. */
export function unwrap(command: string): string {
  const i = command.indexOf(FRAGMENT_START);
  const j = command.lastIndexOf(FRAGMENT_END);
  if (i < 0 || j < 0) return command;
  return command.slice(i + FRAGMENT_START.length, j);
}

const FRAGMENT_START = "# >>> hook fragment\n";
const FRAGMENT_END = "\n# <<< hook fragment";

const PREAMBLE = [
  "#!/usr/bin/env bash",
  "HOOK_INPUT=$(cat)",
  "decision=allow",
  "message=''",
  "PROJECT_DIR=\"${CLAUDE_PROJECT_DIR:-$PWD}\"",
  // Extract the command from the JSON, instead of matching against the
  // whole JSON. The raw input also carries prose: a commit message
  // mentioning `rm -rf` would make a guard fire on text, and a guard that
  // gets in the way of normal work gets turned off.
  "HOOK_COMMAND=$(printf '%s' \"$HOOK_INPUT\" | tr '\\n' ' ' \\",
  "  | sed -n 's/.*\"command\"[[:space:]]*:[[:space:]]*\"\\(\\([^\"\\\\]\\|\\\\.\\)*\\)\".*/\\1/p')",
  "HOOK_FILE=$(printf '%s' \"$HOOK_INPUT\" | tr '\\n' ' ' \\",
  "  | sed -n 's/.*\"\\(file_path\\|path\\)\"[[:space:]]*:[[:space:]]*\"\\(\\([^\"\\\\]\\|\\\\.\\)*\\)\".*/\\2/p')",
  "",
].join("\n");

const POSTAMBLE = [
  "",
  "# Emits the decision the fragment set. Without this, the fragment doesn't block.",
  "case \"$decision\" in",
  "  deny) printf '%s\\n' \"$message\" >&2; exit 2 ;;",
  "  ask)  printf '%s\\n' \"$message\" >&2; exit 2 ;;",
  "  *)    exit 0 ;;",
  "esac",
].join("\n");

interface SettingsEntry {
  matcher: string;
  hooks: { type: "command"; command: string; blocking?: boolean }[];
}

export interface Settings {
  hooks: Partial<Record<TargetEvent, SettingsEntry[]>>;
}

/**
 * Assembles the target's configuration object.
 *
 * Returns a data structure, not text. Whoever serializes it is whoever
 * writes it, and the JSON serializer escapes exactly once.
 */
export function renderSettings(hooks: readonly TranslatedHook[]): Settings {
  const settings: Settings = { hooks: {} };
  for (const h of hooks) {
    const list = (settings.hooks[h.event] ??= []);
    list.push({
      matcher: h.name,
      hooks: [{ type: "command", command: h.script, ...(h.blocking ? { blocking: true } : {}) }],
    });
  }
  return settings;
}

/** Recovers the scripts in the order they were inserted, to check the round trip. */
export function extractScripts(settings: Settings): string[] {
  const order: TargetEvent[] = ["PreToolUse", "PostToolUse", "Stop"];
  const out: string[] = [];
  for (const event of order) {
    for (const entry of settings.hooks[event] ?? []) {
      for (const h of entry.hooks) out.push(h.command);
    }
  }
  return out;
}
