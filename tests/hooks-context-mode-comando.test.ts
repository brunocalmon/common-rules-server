import { describe, it, expect } from "vitest";
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { readHook } from "../src/hooks/source";
import { translateForClaudeCode } from "../src/hooks/claude-code";

const CONTEXT_MODE_HOOKS = [
  "context-mode-pretooluse.md",
  "context-mode-posttooluse.md",
  "context-mode-stop.md",
];

describe("AC-009 — the final command contains no unresolved placeholder", () => {
  // SPECSFY: US-002 FR-002 AC-009
  it("no fragment contains the {ide} key", () => {
    for (const name of CONTEXT_MODE_HOOKS) {
      const hook = readHook(readFileSync(join("resources", "hooks", name), "utf8"));
      expect(hook.script).not.toContain("{ide}");
    }
  });

  // SPECSFY: US-002 FR-002 AC-009
  it("the command starts with context-mode hook claude-code", () => {
    for (const name of CONTEXT_MODE_HOOKS) {
      const hook = readHook(readFileSync(join("resources", "hooks", name), "utf8"));
      expect(hook.script.trim()).toMatch(/^context-mode hook claude-code /);
    }
  });

  // SPECSFY: US-002 FR-002 AC-009
  // Generous timeout: the real `context-mode`, called for real and not
  // mocked, can legitimately take longer than Vitest's default 5s when
  // `npm run verify` runs install, build and the suite together — that's
  // exactly what produced a false red on this case's first run.
  it("the translated script actually runs and doesn't throw on syntax", () => {
    const hook = readHook(readFileSync(join("resources", "hooks", "context-mode-pretooluse.md"), "utf8"));
    const translated = translateForClaudeCode(hook);
    const dir = mkdtempSync(join(tmpdir(), "crs-cm-"));
    const path = join(dir, "hook.sh");
    writeFileSync(path, translated.script, { mode: 0o755 });
    const r = spawnSync("bash", [path], {
      input: '{"tool_input":{"command":"echo x"}}',
      encoding: "utf8",
      timeout: 25_000,
    });
    expect(r.error).toBeUndefined();
    expect(r.status).not.toBeNull();
  }, 30_000);
});
