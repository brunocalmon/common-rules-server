import { describe, it, expect } from "vitest";
import { installSkills } from "../src/skills/install";
import { projetoComSkills, executorFalso, CONJUNTO_SPECSFY, CONJUNTO_MATTPOCOCK } from "./skills-fixtures";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const skillsDe = (raiz: string) => readdirSync(join(raiz, ".claude", "skills")).sort();

describe("AC-020 — um único setup deixa os dois instalados", () => {
  // SPECSFY: US-020 FR-020 AC-020
  it("as skills de mattpocock chegam a .claude/skills/", async () => {
    const raiz = projetoComSkills();
    const ex = executorFalso("sucesso", raiz);
    await installSkills({ root: raiz, source: "mattpocock/skills", execute: ex.fn });
    for (const n of CONJUNTO_MATTPOCOCK) expect(skillsDe(raiz)).toContain(n);
  });

  // SPECSFY: US-020 FR-026 AC-020
  it("nenhum diretório preexistente foi removido ou renomeado", async () => {
    const raiz = projetoComSkills();
    const antes = skillsDe(raiz);
    const ex = executorFalso("sucesso", raiz);
    await installSkills({ root: raiz, source: "mattpocock/skills", execute: ex.fn });
    const depois = skillsDe(raiz);
    for (const n of antes) expect(depois).toContain(n);
    // Presença não prova ausência de remoção: a contagem tem de crescer, nunca encolher.
    expect(depois.length).toBeGreaterThan(antes.length);
  });

  // SPECSFY: US-020 FR-020 FR-026 AC-020
  it("a invocação restringe o alvo e pede cópia, sem interação", async () => {
    const raiz = projetoComSkills();
    const ex = executorFalso("sucesso", raiz);
    await installSkills({ root: raiz, source: "mattpocock/skills", execute: ex.fn });
    const args = ex.chamadas.at(0) ?? [];
    expect(args).toContain("mattpocock/skills");
    expect(args).toContain("--copy");
    expect(args.join(" ")).toMatch(/claude-code/);
    expect(args).not.toContain("--global");
    expect(args).not.toContain("-g");
    expect(CONJUNTO_SPECSFY.length).toBe(3);
  });
});
