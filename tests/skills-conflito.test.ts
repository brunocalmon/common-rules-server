import { describe, it, expect } from "vitest";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { installSkills } from "../src/skills/install";
import { projetoComSkills, executorFalso, CONJUNTO_MATTPOCOCK } from "./skills-fixtures";

/** Prepara um diretório cujo nome o outro conjunto também usaria. */
function comConflito(): string {
  const raiz = projetoComSkills();
  const nome = CONJUNTO_MATTPOCOCK[0]!;
  mkdirSync(join(raiz, ".claude", "skills", nome), { recursive: true });
  writeFileSync(join(raiz, ".claude", "skills", nome, "SKILL.md"), "conteudo-preexistente\n");
  return raiz;
}

describe("AC-027 — dois conjuntos disputam o mesmo nome de diretório", () => {
  // SPECSFY: US-022 FR-026 AC-027
  it("recusa em vez de sobrescrever", async () => {
    const raiz = comConflito();
    const r = await installSkills({ root: raiz, source: "mattpocock/skills", execute: executorFalso("sucesso", raiz).fn });
    expect(r.isError).toBe(true);
  });

  // SPECSFY: US-022 FR-026 AC-027
  it("nomeia o conflito", async () => {
    const raiz = comConflito();
    const r = await installSkills({ root: raiz, source: "mattpocock/skills", execute: executorFalso("sucesso", raiz).fn });
    expect(r.report).toContain(CONJUNTO_MATTPOCOCK[0]!);
  });

  // SPECSFY: US-022 NFR-020 AC-027
  it("o conteúdo do diretório existente permanece", async () => {
    const raiz = comConflito();
    await installSkills({ root: raiz, source: "mattpocock/skills", execute: executorFalso("sucesso", raiz).fn });
    const p = join(raiz, ".claude", "skills", CONJUNTO_MATTPOCOCK[0]!, "SKILL.md");
    expect(readFileSync(p, "utf8")).toContain("conteudo-preexistente");
  });
});
