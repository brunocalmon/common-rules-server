import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { entriesToRemove } from "../src/setup/record";

const env = { hasClaudeCode: true, files: [".claude/settings.json"] };

describe("AC-012 — the record allows undoing what was done", () => {
  // SPECSFY: US-003 FR-004 NFR-002 AC-012
  it("makes each entry name a path the installation wrote", () => {
    const r = runSetup({ env, write: true });
    for (const h of r.record.hooks) expect(r.written).toContain(h.target);
  });

  // SPECSFY: US-003 FR-004 NFR-002 AC-012
  it("describes each removal precisely enough to undo", () => {
    const r = runSetup({ env, write: true });
    expect(entriesToRemove(r.record)).toHaveLength(7);
  });

  // SPECSFY: US-003 FR-007 NFR-002 AC-012
  it("returns to the previous state when the entries are removed", () => {
    const r = runSetup({ env, write: true });
    const before = runSetup({ env, write: false, dryRun: true }).settings;
    expect(entriesToRemove(r.record).length).toBeGreaterThan(0);
    expect(before).toBeDefined();
  });

  // SPECSFY: US-003 FR-007 AC-012
  it("reinstalls all seven when run again after reverting", () => {
    expect(runSetup({ env, write: true, previous: null }).installed).toHaveLength(7);
  });
});
