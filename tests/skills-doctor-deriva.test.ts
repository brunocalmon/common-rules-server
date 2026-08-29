import { describe, it, expect } from "vitest";
import { rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { reportSkills } from "../src/skills/record";
import { arvore, projetoComSkills, escreverLock, CONJUNTO_MATTPOCOCK } from "./skills-fixtures";

/** Registro diz três; o disco perdeu um. */
function projetoDivergente(): { raiz: string; sumido: string } {
  const raiz = projetoComSkills();
  for (const n of CONJUNTO_MATTPOCOCK) {
    mkdirSync(join(raiz, ".claude", "skills", n), { recursive: true });
    writeFileSync(join(raiz, ".claude", "skills", n, "SKILL.md"), "corpo\n");
  }
  escreverLock(raiz, CONJUNTO_MATTPOCOCK);
  const sumido = CONJUNTO_MATTPOCOCK[1]!;
  rmSync(join(raiz, ".claude", "skills", sumido), { recursive: true, force: true });
  return { raiz, sumido };
}

describe("AC-025 — conteúdo alterado depois da instalação", () => {
  // SPECSFY: US-021 FR-024 AC-025
  it("nomeia o conjunto divergente", () => {
    const { raiz, sumido } = projetoDivergente();
    const divergentes = reportSkills(raiz).results.filter((r) => r.diverged).map((r) => r.name);
    expect(divergentes).toContain(sumido);
  });

  // SPECSFY: US-021 FR-024 AC-025
  it("sai com código diferente de zero", () => {
    const { raiz } = projetoDivergente();
    expect(reportSkills(raiz).exitCode).not.toBe(0);
  });

  // SPECSFY: US-021 NFR-020 AC-025
  it("nenhum arquivo é criado, alterado ou removido", () => {
    const { raiz } = projetoDivergente();
    const antes = arvore(raiz);
    reportSkills(raiz);
    expect(arvore(raiz)).toEqual(antes);
  });
});
