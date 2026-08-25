import { describe, it, expect } from "vitest";
import { readRecord, writeRecord } from "../src/setup/record";
import { runSetup } from "../src/setup/run";

const env = { hasClaudeCode: true, files: [".claude/settings.json"] };

describe("AC-004 — o registro nomeia o que foi escrito", () => {
  // SPECSFY: US-003 FR-004 FR-005 AC-004
  it("registra os sete hooks instalados", () => {
    const r = readRecord(runSetup({ env, write: true }).record);
    expect(r.hooks).toHaveLength(7);
  });

  // SPECSFY: US-003 FR-004 AC-004
  it("declara destino, versão e data em cada entrada", () => {
    for (const h of readRecord(runSetup({ env, write: true }).record).hooks) {
      expect(h.target).toBeTruthy();
      expect(h.version).toBeTruthy();
      expect(Date.parse(h.installedAt)).not.toBeNaN();
    }
  });

  // SPECSFY: US-003 FR-001 AC-004
  it("nomeia o alvo que a detecção escolheu", () => {
    expect(readRecord(runSetup({ env, write: true }).record).target).toMatch(/claude/i);
  });

  // SPECSFY: US-003 FR-004 AC-004
  it("relê o que gravou sem perder informação", () => {
    const original = readRecord(runSetup({ env, write: true }).record);
    expect(readRecord(writeRecord(original))).toEqual(original);
  });
});
