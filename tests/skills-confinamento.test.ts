import { describe, it, expect } from "vitest";
import { installSkills } from "../src/skills/install";
import { arvore, projetoComSkills, executorFalso, foraDoProjeto } from "./skills-fixtures";

describe("AC-022 — nada é escrito fora da raiz", () => {
  // SPECSFY: US-020 FR-022 AC-022
  it("o diretório do usuário permanece igual, inclusive onde a forma global escreveria", async () => {
    const raiz = projetoComSkills();
    const antes = foraDoProjeto();
    await installSkills({ root: raiz, source: "mattpocock/skills", execute: executorFalso("sucesso", raiz).fn });
    expect(foraDoProjeto()).toEqual(antes);
  });

  // SPECSFY: US-020 NFR-022 AC-022
  it("os arquivos aparecem apenas dentro do projeto", async () => {
    const raiz = projetoComSkills();
    const vizinho = projetoComSkills("crs-vizinho-");
    const antesVizinho = arvore(vizinho);
    await installSkills({ root: raiz, source: "mattpocock/skills", execute: executorFalso("sucesso", raiz).fn });
    expect(arvore(vizinho)).toEqual(antesVizinho);
  });

  // SPECSFY: US-020 FR-022 NFR-022 AC-022
  it("a invocação nunca constrói a forma global", async () => {
    const raiz = projetoComSkills();
    const ex = executorFalso("sucesso", raiz);
    await installSkills({ root: raiz, source: "mattpocock/skills", execute: ex.fn });
    for (const args of ex.chamadas) {
      expect(args).not.toContain("-g");
      expect(args).not.toContain("--global");
    }
  });
});
