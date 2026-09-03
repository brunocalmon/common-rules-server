import { describe, it, expect } from "vitest";
import { detectTarget } from "../src/hooks/detect";
import { runSetup } from "../src/setup/run";

const noEvidence = { hasClaudeCode: false, files: [] as string[] };
const withEvidence = { hasClaudeCode: true, files: [".claude/settings.json"] };

describe("AC-006 — with no target evidence, nothing is written", () => {
  // SPECSFY: US-001 FR-001 AC-006
  it("doesn't recognize a target when evidence is missing", () => {
    expect(detectTarget(noEvidence).found).toBe(false);
  });

  // SPECSFY: US-001 FR-001 NFR-001 AC-006
  it("writes no file at all and ends without error", () => {
    const r = runSetup({ env: noEvidence, write: false });
    expect(r.written).toEqual([]);
    expect(r.exitCode).toBe(0);
  });

  // SPECSFY: US-001 FR-001 AC-006
  it("names the ignored target and the missing evidence", () => {
    const r = runSetup({ env: noEvidence, write: false });
    expect(r.report).toMatch(/claude/i);
    expect(r.report).toMatch(/evid/i);
  });

  // SPECSFY: US-001 FR-008 AC-006
  it("doesn't create a local subsystem copy", () => {
    expect(runSetup({ env: noEvidence, write: false }).bridged).toBe(false);
  });

  // SPECSFY: US-001 FR-001 AC-006
  it("recognizes the target when the evidence exists", () => {
    expect(detectTarget(withEvidence).found).toBe(true);
  });
});
