import { describe, it, expect } from "vitest";
import { installSkills } from "../src/skills/install";
import { readLock, toRecordEntries } from "../src/skills/record";
import { arvore, projetoComSkills, executorFalso, CONJUNTO_MATTPOCOCK } from "./skills-fixtures";

describe("AC-029 — a segunda execução reconhece o estado", () => {
  const duasVezes = async () => {
    const raiz = projetoComSkills();
    const opts = { root: raiz, source: "mattpocock/skills", execute: executorFalso("sucesso", raiz).fn };
    await installSkills(opts);
    const meio = arvore(raiz);
    const segunda = await installSkills({ ...opts, previous: toRecordEntries(readLock(raiz)) });
    return { raiz, meio, segunda };
  };

  // SPECSFY: US-020 FR-023 AC-029
  it("o registro mantém uma entrada por conjunto", async () => {
    const { raiz } = await duasVezes();
    const nomes = toRecordEntries(readLock(raiz)).map((e) => e.name);
    expect(new Set(nomes).size).toBe(CONJUNTO_MATTPOCOCK.length);
    expect(nomes.length).toBe(CONJUNTO_MATTPOCOCK.length);
  });

  // SPECSFY: US-020 NFR-020 AC-029
  it("nenhum conteúdo instalado foi removido", async () => {
    const { raiz, meio } = await duasVezes();
    for (const caminho of meio) expect(arvore(raiz)).toContain(caminho);
  });

  // SPECSFY: US-020 FR-026 AC-029
  it("a segunda execução não é relatada como instalação nova", async () => {
    const { segunda } = await duasVezes();
    expect(segunda.changed).toBe(false);
  });
});
