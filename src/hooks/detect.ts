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

/** Paths whose presence counts as evidence of target use. */
const EVIDENCE = [".claude/settings.json", ".claude/settings.local.json", ".claude/"];

/**
 * Decides whether there's evidence of target use, without writing anything.
 *
 * Not configuring isn't a failure. Writing into an editor the person
 * doesn't use is worse than not writing: it leaves an orphan file nobody
 * asked for and nobody maintains.
 */
export function detectTarget(env: TargetEnvironment): Detection {
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
