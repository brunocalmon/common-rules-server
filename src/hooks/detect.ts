/** What detection observes in the project, injected so it doesn't depend on the machine. */
export interface TargetEnvironment {
  hasClaudeCode: boolean;
  files: readonly string[];
}

export interface Detection {
  found: boolean;
  target: string;
  /** Evidence that supported the decision, or what was missing to support it. */
  reason: string;
}

export const TARGET = "claude-code";

/** Every target `setup --target` accepts explicitly. */
export const KNOWN_TARGETS: readonly string[] = [TARGET];

/** Paths whose presence counts as evidence of target use. */
const EVIDENCE = [".claude/settings.json", ".claude/settings.local.json", ".claude/"];

/**
 * Decides whether there's evidence of target use, without writing anything.
 *
 * Not configuring isn't a failure. Writing into an editor the person
 * doesn't use is worse than not writing: it leaves an orphan file nobody
 * asked for and nobody maintains. That's the default, evidence-based path.
 *
 * `explicitTarget`, given, skips evidence entirely: a caller that already
 * knows which editor it's running in — the MCP facade reading its own
 * client handshake, or a person passing `--target` by hand — has better
 * information than anything the filesystem can show. This is also the only
 * way to configure a brand-new project: on one, `.claude/` cannot exist
 * yet, since creating it is what `setup` is for, so evidence-based
 * detection can never find anything to act on there.
 */
export function detectTarget(env: TargetEnvironment, explicitTarget?: string): Detection {
  if (explicitTarget !== undefined) {
    if (!KNOWN_TARGETS.includes(explicitTarget)) {
      return {
        found: false,
        target: explicitTarget,
        reason: `unknown target "${explicitTarget}"; known targets: ${KNOWN_TARGETS.join(", ")}`,
      };
    }
    return { found: true, target: explicitTarget, reason: `explicit: --target ${explicitTarget}` };
  }

  const found = EVIDENCE.filter((e) => env.files.some((f) => f.startsWith(e)));
  if (env.hasClaudeCode && found.length > 0) {
    return { found: true, target: TARGET, reason: `evidence found: ${found.join(", ")}` };
  }
  return {
    found: false,
    target: TARGET,
    reason: `no evidence of ${TARGET} use; none of ${EVIDENCE.join(", ")} is present`,
  };
}
