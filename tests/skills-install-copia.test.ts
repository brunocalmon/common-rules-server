import { describe, it, expect } from "vitest";
import { installSkills } from "../src/skills/install";
import { inspectSkills } from "../src/skills/inventory";
import { projetoComSkills, executorFalso } from "./skills-fixtures";

describe("AC-021 — nenhuma entrada instalada é link simbólico", () => {
  // SPECSFY: US-020 FR-021 AC-021
  it("o inventário não encontra link em nível algum", async () => {
    const raiz = projetoComSkills();
    await installSkills({ root: raiz, source: "mattpocock/skills", execute: executorFalso("sucesso", raiz).fn });
    expect(inspectSkills(raiz).symlinks).toEqual([]);
  });

  // SPECSFY: US-020 NFR-022 AC-021
  it("o conteúdo lido pelo agente vive dentro do projeto", async () => {
    const raiz = projetoComSkills();
    await installSkills({ root: raiz, source: "mattpocock/skills", execute: executorFalso("sucesso", raiz).fn });
    const r = inspectSkills(raiz);
    expect(r.ok).toBe(true);
    for (const d of r.dirs) expect(d.startsWith("/")).toBe(false);
  });

  // SPECSFY: US-020 FR-021 AC-021
  it("a invocação pede cópia explicitamente, em vez de aceitar o padrão", async () => {
    const raiz = projetoComSkills();
    const ex = executorFalso("sucesso", raiz);
    await installSkills({ root: raiz, source: "mattpocock/skills", execute: ex.fn });
    expect((ex.chamadas.at(0) ?? []).includes("--copy")).toBe(true);
  });
});
