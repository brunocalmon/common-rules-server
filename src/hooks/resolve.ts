/**
 * Rewrites a hook's leading command to a resolved absolute path, so the
 * generated hook works even on a machine that never installed the
 * dependency globally.
 *
 * Every hook's `raw_command` — `context-mode hook claude-code pretooluse`,
 * `code-review-graph update --brief` — was embedded verbatim, trusting
 * PATH at the moment Claude Code actually fires the hook inside the
 * consumer project. That's a different process, on a possibly different
 * machine, than the one running `common-rules setup`; nothing guaranteed
 * PATH would resolve either binary there. `common-rules` itself always
 * has both reachable at a known, absolute location — `context-mode` as
 * its own hard npm dependency, `code-review-graph` via the local bridge
 * in `bridge.ts` — so baking that path in at setup time, once, is strictly
 * more reliable than hoping the same name resolves again later, elsewhere.
 */

/** Binary name (the hook's first token) → resolved absolute path, or null to keep relying on PATH. */
export type DependencyResolution = Record<string, string | null>;

/** Wraps a path for safe interpolation into a POSIX shell command line. */
function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/**
 * Replaces a script's leading command with its resolved path, when one is
 * known. Falls back to the script unchanged — relying on PATH exactly as
 * before — for any command this resolution doesn't mention, which is the
 * common case for every hook that isn't a dependency dispatch.
 */
export function resolveHookCommand(script: string, resolution: DependencyResolution): string {
  const match = /^(\S+)([\s\S]*)$/.exec(script);
  if (!match) return script;
  const bin = match[1];
  const rest = match[2] ?? "";
  if (bin === undefined) return script;
  const resolved = resolution[bin];
  if (!resolved) return script;
  return `${shellQuote(resolved)}${rest}`;
}
