import { execFileSync } from "node:child_process";
import { KNOWN_AGENT_BACKENDS, SUPPORTED_AGENT_BACKENDS } from "./known.js";

/**
 * Resolution source, injected so the suite doesn't depend on what's
 * installed on the machine running it — same pattern as `doctor`'s
 * `Environment` and fatia 1a's `TargetEnvironment`.
 */
export interface BackendEnvironment {
  /** Presence on `PATH`, independent of whether `--version` responds. */
  resolvePresence(name: string): boolean;
  /** Version reported by `--version`, or `null` when not interpretable. */
  resolveVersion(name: string): string | null;
}

export interface BackendResult {
  name: string;
  present: boolean;
  version: string | null;
  supported: boolean;
}

const commandExists = (name: string): boolean => {
  try {
    execFileSync("which", [name], { stdio: ["ignore", "ignore", "ignore"] });
    return true;
  } catch {
    return false;
  }
};

/**
 * Extracts the version from `--version`'s output.
 *
 * The last token, which is enough for `code-review-graph` in `doctor.ts`,
 * breaks here: `claude --version` returns `2.1.251 (Claude Code)`, whose
 * last token is `Code)`. Preferring the first token that starts with a
 * digit resolves `claude` and `codex-cli 0.151.0` at once, falling back to
 * the last token only when none starts with a digit.
 */
const probeVersion = (name: string): string | null => {
  try {
    const out = execFileSync(name, ["--version"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const tokens = out.trim().split(/\s+/);
    return tokens.find((t) => /^\d/.test(t)) ?? tokens.pop() ?? null;
  } catch {
    return null;
  }
};

/** Real environment. Presence via `which`, version via `--version` — never `--help`. */
export function realBackendEnvironment(): BackendEnvironment {
  return { resolvePresence: commandExists, resolveVersion: probeVersion };
}

/**
 * Detects each known candidate backend, without invoking more than needed
 * for presence and version.
 *
 * Presence doesn't depend on `--version` responding: a present backend
 * whose `--version` fails or returns non-interpretable output stays
 * present, with an unknown version — the same distinction between
 * "capable" and "ready to respond" that this fatia's research observed in
 * `goose run` without a configured credential.
 */
export function detectBackends(
  env: BackendEnvironment,
  known: readonly string[] = KNOWN_AGENT_BACKENDS,
  supported: readonly string[] = SUPPORTED_AGENT_BACKENDS,
): BackendResult[] {
  return known.map((name) => {
    const present = env.resolvePresence(name);
    const version = present ? env.resolveVersion(name) : null;
    return { name, present, version, supported: supported.includes(name) };
  });
}
