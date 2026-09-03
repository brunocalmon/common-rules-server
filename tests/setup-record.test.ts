import { describe, it, expect } from "vitest";
import { readRecord, writeRecord } from "../src/setup/record";
import { runSetup } from "../src/setup/run";

const env = { hasClaudeCode: true, files: [".claude/settings.json"] };

describe("AC-004 — the record names what was written", () => {
  // SPECSFY: US-003 FR-004 FR-005 AC-004
  it("records the seven installed hooks", () => {
    const r = readRecord(runSetup({ env, write: true }).record);
    expect(r.hooks).toHaveLength(7);
  });

  // SPECSFY: US-003 FR-004 AC-004
  it("declares target, version and date in each entry", () => {
    for (const h of readRecord(runSetup({ env, write: true }).record).hooks) {
      expect(h.target).toBeTruthy();
      expect(h.version).toBeTruthy();
      expect(Date.parse(h.installedAt)).not.toBeNaN();
    }
  });

  // SPECSFY: US-003 FR-001 AC-004
  it("names the target detection chose", () => {
    expect(readRecord(runSetup({ env, write: true }).record).target).toMatch(/claude/i);
  });

  // SPECSFY: US-003 FR-004 AC-004
  it("reads back what it wrote without losing information", () => {
    const original = readRecord(runSetup({ env, write: true }).record);
    expect(readRecord(writeRecord(original))).toEqual(original);
  });
});
