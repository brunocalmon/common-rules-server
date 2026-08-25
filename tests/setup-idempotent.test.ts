import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";

const env = { hasClaudeCode: true, files: [".claude/settings.json"] };

describe("AC-005 — reexecutar não duplica", () => {
  // SPECSFY: US-003 FR-007 NFR-002 AC-005
  it("deixa a configuração do alvo idêntica na segunda execução", () => {
    const um = runSetup({ env, write: true });
    const dois = runSetup({ env, write: true, previous: um.record });
    expect(dois.settings).toEqual(um.settings);
  });

  // SPECSFY: US-003 FR-007 AC-005
  it("relata que já estava configurado", () => {
    const um = runSetup({ env, write: true });
    expect(runSetup({ env, write: true, previous: um.record }).report).toMatch(/já|inalterad/i);
  });

  // SPECSFY: US-003 FR-005 NFR-002 AC-005
  it("não acrescenta entrada duplicada ao registro", () => {
    const um = runSetup({ env, write: true });
    const dois = runSetup({ env, write: true, previous: um.record });
    expect(dois.record.hooks).toHaveLength(7);
  });

  // SPECSFY: US-003 FR-008 AC-005
  it("não recria a cópia local que já existe", () => {
    const um = runSetup({ env, write: true });
    expect(runSetup({ env, write: true, previous: um.record }).bridged).toBe(false);
  });
});
