import { describe, it, expect } from "vitest";
import { readLock, toRecordEntries } from "../src/skills/record";
import { projetoComSkills, escreverLock, CONJUNTO_MATTPOCOCK } from "./skills-fixtures";

describe("AC-023 — cada conjunto aparece com sua procedência", () => {
  const preparar = () => {
    const raiz = projetoComSkills();
    escreverLock(raiz, CONJUNTO_MATTPOCOCK);
    return raiz;
  };

  // SPECSFY: US-021 FR-023 AC-023
  it("cada conjunto instalado aparece nomeado", () => {
    const nomes = toRecordEntries(readLock(preparar())).map((e) => e.name).sort();
    expect(nomes).toEqual([...CONJUNTO_MATTPOCOCK].sort());
  });

  // SPECSFY: US-021 FR-023 AC-023
  it("traz a origem de onde veio", () => {
    for (const e of toRecordEntries(readLock(preparar()))) expect(e.source).toBe("mattpocock/skills");
  });

  // SPECSFY: US-021 FR-023 AC-023
  it("traz a procedência lida do lockfile, sem recalcular", () => {
    for (const e of toRecordEntries(readLock(preparar()))) {
      expect(e.computedHash).toBe(`hash-${e.name}`);
      expect(e.skillPath).toContain(e.name);
    }
  });
});
