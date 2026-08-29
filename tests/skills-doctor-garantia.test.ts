import { describe, it, expect } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { reportSkills } from "../src/skills/record";
import { projetoComSkills, escreverLock, CONJUNTO_MATTPOCOCK } from "./skills-fixtures";

function projetoInstalado(): string {
  const raiz = projetoComSkills();
  for (const n of CONJUNTO_MATTPOCOCK) {
    mkdirSync(join(raiz, ".claude", "skills", n), { recursive: true });
    writeFileSync(join(raiz, ".claude", "skills", n, "SKILL.md"), "corpo\n");
  }
  escreverLock(raiz, CONJUNTO_MATTPOCOCK);
  return raiz;
}

describe("AC-030 — o relato não promete o que não entrega", () => {
  // SPECSFY: US-021 FR-024 AC-030
  it("informa que a referência não é fixada pela origem", () => {
    expect(reportSkills(projetoInstalado()).note).toMatch(/não fixa|não é fixad/i);
  });

  // SPECSFY: US-021 NFR-021 AC-030
  it("não afirma que duas máquinas obterão conteúdo idêntico", () => {
    expect(reportSkills(projetoInstalado()).note).not.toMatch(/reprodut[íi]vel|id[êe]ntico em qualquer/i);
  });

  // SPECSFY: US-021 NFR-021 AC-030
  it("a declaração acompanha o relato mesmo sem divergência", () => {
    const r = reportSkills(projetoInstalado());
    expect(r.exitCode).toBe(0);
    expect(r.note.length).toBeGreaterThan(0);
  });
});
