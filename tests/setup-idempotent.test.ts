import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";

const env = { hasClaudeCode: true, files: [".claude/settings.json"] };

describe("AC-005 — rerunning doesn't duplicate", () => {
  // SPECSFY: US-003 FR-007 NFR-002 AC-005
  it("leaves the target's configuration identical on the second run", () => {
    const one = runSetup({ env, write: true });
    const two = runSetup({ env, write: true, previous: one.record });
    expect(two.settings).toEqual(one.settings);
  });

  // SPECSFY: US-003 FR-007 AC-005
  it("reports it was already configured", () => {
    const one = runSetup({ env, write: true });
    expect(runSetup({ env, write: true, previous: one.record }).report).toMatch(/already|unchanged/i);
  });

  // SPECSFY: US-003 FR-005 NFR-002 AC-005
  it("doesn't add a duplicate entry to the record", () => {
    const one = runSetup({ env, write: true });
    const two = runSetup({ env, write: true, previous: one.record });
    expect(two.record.hooks).toHaveLength(7);
  });

  // SPECSFY: US-003 FR-008 AC-005
  it("doesn't recreate the local copy that already exists", () => {
    const one = runSetup({ env, write: true });
    expect(runSetup({ env, write: true, previous: one.record }).bridged).toBe(false);
  });
});
