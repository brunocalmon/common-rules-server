import { describe, it, expect } from "vitest";
import { installSkills } from "../src/skills/install";
import { readLock } from "../src/skills/record";
import { projetoComSkills, executorFalso } from "./skills-fixtures";

describe("AC-031 — a instalação é interrompida antes de terminar", () => {
  // SPECSFY: US-022 FR-020 AC-031
  it("relata que o conjunto não ficou instalado", async () => {
    const raiz = projetoComSkills();
    const r = await installSkills({ root: raiz, source: "mattpocock/skills", execute: executorFalso("erro", raiz).fn });
    expect(r.isError).toBe(true);
    expect(r.installed).toEqual([]);
  });

  // SPECSFY: US-022 NFR-021 AC-031
  it("o registro não ganha entrada para conjunto incompleto", async () => {
    const raiz = projetoComSkills();
    await installSkills({ root: raiz, source: "mattpocock/skills", execute: executorFalso("erro", raiz).fn });
    // O executor deixou um diretório para trás de propósito; o lockfile é que decide.
    expect(readLock(raiz)).toBeNull();
  });

  // SPECSFY: US-022 FR-020 NFR-021 AC-031
  it("parcial não passa por completo no relato", async () => {
    const raiz = projetoComSkills();
    const r = await installSkills({ root: raiz, source: "mattpocock/skills", execute: executorFalso("erro", raiz).fn });
    expect(r.report).not.toMatch(/instalad[oa]s? com sucesso/i);
  });
});
