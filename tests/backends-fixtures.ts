import type { BackendEnvironment } from "../src/backends/detect";

export type Call = { name: string; kind: "presence" | "version" };

/**
 * No agent backend present — for `doctor` tests that predate fatia 1d and
 * aren't meant to exercise the `agent` layer, and which would otherwise
 * silently fall through to the real environment (NFR-032, SPEC-0008).
 */
export const noBackends: BackendEnvironment = {
  resolvePresence: () => false,
  resolveVersion: () => null,
};

/** Fake source: `present` maps name to version; a missing key means the backend is absent. */
export function sourceFake(present: Record<string, string>): { env: BackendEnvironment; calls: Call[] } {
  const calls: Call[] = [];
  const env: BackendEnvironment = {
    resolvePresence: (name) => {
      calls.push({ name, kind: "presence" });
      return name in present;
    },
    resolveVersion: (name) => {
      calls.push({ name, kind: "version" });
      return present[name] ?? null;
    },
  };
  return { env, calls };
}
