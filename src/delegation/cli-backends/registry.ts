import type { CliBackendAdapter } from "./adapter.js";
import { pi } from "./pi.js";
import { claude } from "./claude.js";
import { goose } from "./goose.js";
import { agy } from "./agy.js";
import { codex } from "./codex.js";

/** One adapter per name in `SUPPORTED_AGENT_BACKENDS`, fixed — not discovered. */
const ADAPTERS: Record<string, CliBackendAdapter> = { pi, agy, claude, codex, goose };

/** Resolves a backend's adapter by name, or `undefined` when unknown. */
export function resolveAdapter(name: string): CliBackendAdapter | undefined {
  return ADAPTERS[name];
}
