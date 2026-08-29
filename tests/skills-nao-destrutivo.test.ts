import { describe, it, expect } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { installSkills } from "../src/skills/install";
import { readLock, toRecordEntries, reportSkills } from "../src/skills/record";
import { arvore, projetoComSkills, executorFalso, foraDoProjeto, CONJUNTO_MATTPOCOCK } from "./skills-fixtures";

describe("AC-032 — recusa, conflito e reexecução preservam o que existe", () => {
  // SPECSFY: US-020 FR-026 NFR-020 AC-032
  it("a recusa por conflito não apaga nada", async () => {
    const raiz = projetoComSkills();
    const nome = CONJUNTO_MATTPOCOCK[0]!;
    mkdirSync(join(raiz, ".claude", "skills", nome), { recursive: true });
    writeFileSync(join(raiz, ".claude", "skills", nome, "SKILL.md"), "preexistente\n");
    const antes = arvore(raiz);
    await installSkills({ root: raiz, source: "mattpocock/skills", execute: executorFalso("sucesso", raiz).fn });
    for (const caminho of antes) expect(arvore(raiz)).toContain(caminho);
  });

  // SPECSFY: US-020 FR-021 NFR-020 AC-032
  it("a reexecução não apaga nada", async () => {
    const raiz = projetoComSkills();
    const opts = { root: raiz, source: "mattpocock/skills", execute: executorFalso("sucesso", raiz).fn };
    await installSkills(opts);
    const meio = arvore(raiz);
    await installSkills({ ...opts, previous: toRecordEntries(readLock(raiz)) });
    for (const caminho of meio) expect(arvore(raiz)).toContain(caminho);
  });

  // SPECSFY: US-020 FR-022 NFR-022 AC-032
  it("nada fora da raiz do projeto foi tocado em qualquer dos caminhos", async () => {
    const raiz = projetoComSkills();
    const vizinho = projetoComSkills("crs-vizinho-");
    const antesVizinho = arvore(vizinho);
    const antesFora = foraDoProjeto();
    await installSkills({ root: raiz, source: "mattpocock/skills", execute: executorFalso("sucesso", raiz).fn });
    reportSkills(raiz);
    expect(arvore(vizinho)).toEqual(antesVizinho);
    expect(foraDoProjeto()).toEqual(antesFora);
  });
});
