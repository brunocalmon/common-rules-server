import { describe, it, expect } from "vitest";
import { installSkills } from "../src/skills/install";
import { executorDualOrigem, CONJUNTO_MATTPOCOCK, CONJUNTO_SPECSFY } from "./skills-fixtures";
import { mkdtempSync, writeFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Raiz descartável limpa, sem nenhuma origem pré-instalada. */
function raizLimpa(): string {
  const raiz = mkdtempSync(join(tmpdir(), "crs-sk2-"));
  writeFileSync(join(raiz, "package.json"), '{"name":"descartavel"}\n');
  return raiz;
}

const skillsDe = (raiz: string) => readdirSync(join(raiz, ".claude", "skills")).sort();

describe("AC-020 — as duas origens convivem", () => {
  // SPECSFY: US-020 FR-027 AC-020
  it("mattpocock/skills e promovaweb/specsfy convivem em .claude/skills/", async () => {
    const raiz = raizLimpa();
    const ex = executorDualOrigem();
    await installSkills({ root: raiz, source: "mattpocock/skills", execute: ex.fn });
    await installSkills({ root: raiz, source: "promovaweb/specsfy", execute: ex.fn });
    const presentes = skillsDe(raiz);
    for (const n of CONJUNTO_MATTPOCOCK) expect(presentes).toContain(n);
    for (const n of CONJUNTO_SPECSFY) expect(presentes).toContain(n);
  });
});

describe("AC-037 — uma origem falhar não contamina a outra", () => {
  // SPECSFY: US-020 FR-020 FR-027 NFR-021 AC-037
  it("mattpocock falha, promovaweb/specsfy segue instalada", async () => {
    const raiz = raizLimpa();
    const ex = executorDualOrigem("mattpocock/skills");
    const falhou = await installSkills({ root: raiz, source: "mattpocock/skills", execute: ex.fn });
    const sucedeu = await installSkills({ root: raiz, source: "promovaweb/specsfy", execute: ex.fn });
    expect(falhou.isError).toBe(true);
    expect(sucedeu.isError).toBe(false);
    const presentes = skillsDe(raiz);
    for (const n of CONJUNTO_SPECSFY) expect(presentes).toContain(n);
    for (const n of CONJUNTO_MATTPOCOCK) expect(presentes).not.toContain(n);
  });
});
