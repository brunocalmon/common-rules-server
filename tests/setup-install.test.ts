import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";

const env = { hasClaudeCode: true, files: [".claude/settings.json"] };
const run = () => runSetup({ env, write: true, dryRun: false });

describe("AC-001 — the four integration hooks end up installed", () => {
  // SPECSFY: US-001 FR-002 FR-005 AC-001
  it("writes the four subsystem integration entries", () => {
    const names = run().installed.map((h) => h.name);
    for (const n of ["context-mode-pretooluse", "context-mode-posttooluse", "context-mode-stop", "code-review-graph-update"]) {
      expect(names).toContain(n);
    }
  });

  // SPECSFY: US-001 FR-002 AC-001
  it("places each one under the event the hook declares", () => {
    for (const h of run().installed) expect(h.event).toMatch(/^(PreToolUse|PostToolUse|Stop)$/);
  });

  // SPECSFY: US-001 FR-004 AC-001
  it("creates the installation record inside the project", () => {
    expect(run().recordPath).toMatch(/^\.common-rules\//);
  });

  // SPECSFY: US-001 FR-001 NFR-001 AC-001
  it("writes nothing outside the project", () => {
    for (const p of run().written) expect(p.startsWith("/")).toBe(false);
  });
});
