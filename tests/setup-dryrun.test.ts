import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";

const env = { hasClaudeCode: true, files: [".claude/settings.json"] };
const dryRun = () => runSetup({ env, write: true, dryRun: true });

describe("AC-007 — a dry run doesn't write", () => {
  // SPECSFY: US-003 FR-005 FR-007 AC-007
  it("lists the seven hooks that would be installed and their targets", () => {
    expect(dryRun().planned).toHaveLength(7);
    for (const h of dryRun().planned) expect(h.target).toBeTruthy();
  });

  // SPECSFY: US-003 FR-007 NFR-002 AC-007
  it("creates or changes no file at all", () => {
    expect(dryRun().written).toEqual([]);
  });

  // SPECSFY: US-003 FR-004 NFR-002 AC-007
  it("doesn't write the record", () => {
    expect(dryRun().record).toBeNull();
  });
});
