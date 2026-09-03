import { describe, it, expect } from "vitest";
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { readHook } from "../src/hooks/source";
import { translateForClaudeCode } from "../src/hooks/claude-code";

const HOOKS_WITHOUT_BLOCK = [
  "code-review-graph-update.md",
  "context-mode-pretooluse.md",
  "context-mode-posttooluse.md",
  "context-mode-stop.md",
];

/** The command declared in `raw_command:` in the frontmatter, read apart from the parser. */
function declaredCommand(fileName: string): string {
  const raw = readFileSync(join("resources", "hooks", fileName), "utf8");
  const m = /^raw_command:\s*(.+)$/m.exec(raw);
  if (!m || !m[1]) throw new Error(`hook ${fileName} doesn't declare raw_command`);
  return m[1].trim();
}

describe("AC-010 — fragment fidelity for a hook without a code block", () => {
  // SPECSFY: US-001 FR-002 AC-010
  it("the fragment embedded in the script is exactly the declared raw_command", () => {
    for (const name of HOOKS_WITHOUT_BLOCK) {
      const hook = readHook(readFileSync(join("resources", "hooks", name), "utf8"));
      expect(hook.script.trim()).toBe(declaredCommand(name));
    }
  });

  // SPECSFY: US-001 FR-002 AC-010
  it("the translated script contains the command, not an empty fragment", () => {
    for (const name of HOOKS_WITHOUT_BLOCK) {
      const hook = readHook(readFileSync(join("resources", "hooks", name), "utf8"));
      const translated = translateForClaudeCode(hook);
      expect(translated.script).toContain(declaredCommand(name));
    }
  });

  // SPECSFY: US-001 FR-002 AC-010
  it("the command actually runs when the script executes as a subprocess, not just appears in the text", () => {
    const hook = readHook(readFileSync(join("resources", "hooks", "code-review-graph-update.md"), "utf8"));
    const translated = translateForClaudeCode(hook);
    const original = declaredCommand("code-review-graph-update.md");
    // First confirm the command is actually in the script — without this,
    // the substitution below would be a silent no-op and the assertion
    // would pass for nothing, the same defect this task exists to fix.
    expect(translated.script).toContain(original);
    // Replaces the real command with an observable marker, to prove the
    // exact spot where raw_command would go is executed by the
    // interpreter — not merely present as dead text in a comment.
    const script = translated.script.replace(original, "echo REAL_EXECUTION_MARK");
    const dir = mkdtempSync(join(tmpdir(), "crs-hook-"));
    const path = join(dir, "hook.sh");
    writeFileSync(path, script, { mode: 0o755 });
    const r = spawnSync("bash", [path], { input: '{"tool_input":{}}', encoding: "utf8" });
    expect(r.stdout + r.stderr).toContain("REAL_EXECUTION_MARK");
  });
});
