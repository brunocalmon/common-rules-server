import { describe, it, expect } from "vitest";
import { installSkills } from "../src/skills/install";
import { projetoComSkills, executorFalso } from "./skills-fixtures";

describe("AC-028 — o instalador oficial não pode ser executado", () => {
  const executar = async () => {
    const raiz = projetoComSkills();
    return installSkills({ root: raiz, source: "mattpocock/skills", execute: executorFalso("ausente", raiz).fn });
  };

  // SPECSFY: US-022 FR-020 AC-028
  it("a resposta indica que o conjunto não foi instalado", async () => {
    const r = await executar();
    expect(r.isError).toBe(true);
    expect(r.installed).toEqual([]);
  });

  // SPECSFY: US-022 NFR-021 AC-028
  it("não afirma sucesso", async () => {
    expect((await executar()).report).not.toMatch(/instalad[oa]s? com sucesso|conclu[íi]d/i);
  });

  // SPECSFY: US-022 FR-020 NFR-021 AC-028
  it("o relato nomeia a causa", async () => {
    expect((await executar()).report).toMatch(/instalador|dispon[íi]vel|encontrad/i);
  });
});
