import { describe, it, expect } from "vitest";
import { detectTarget } from "../src/hooks/detect";
import { runSetup } from "../src/setup/run";

const semEvidencia = { hasClaudeCode: false, files: [] as string[] };
const comEvidencia = { hasClaudeCode: true, files: [".claude/settings.json"] };

describe("AC-006 — sem evidência do alvo, nada é escrito", () => {
  // SPECSFY: US-001 FR-001 AC-006
  it("não reconhece alvo quando falta evidência", () => {
    expect(detectTarget(semEvidencia).found).toBe(false);
  });

  // SPECSFY: US-001 FR-001 NFR-001 AC-006
  it("não escreve arquivo algum e encerra sem erro", () => {
    const r = runSetup({ env: semEvidencia, write: false });
    expect(r.written).toEqual([]);
    expect(r.exitCode).toBe(0);
  });

  // SPECSFY: US-001 FR-001 AC-006
  it("nomeia o alvo ignorado e a evidência que faltou", () => {
    const r = runSetup({ env: semEvidencia, write: false });
    expect(r.report).toMatch(/claude/i);
    expect(r.report).toMatch(/evid/i);
  });

  // SPECSFY: US-001 FR-008 AC-006
  it("não cria cópia local de subsistema", () => {
    expect(runSetup({ env: semEvidencia, write: false }).bridged).toBe(false);
  });

  // SPECSFY: US-001 FR-001 AC-006
  it("reconhece o alvo quando a evidência existe", () => {
    expect(detectTarget(comEvidencia).found).toBe(true);
  });
});
