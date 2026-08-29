import { describe, it, expect } from "vitest";
import { reportSkills } from "../src/skills/record";
import { projetoComSkills, escreverLock, CONJUNTO_MATTPOCOCK } from "./skills-fixtures";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Registro e disco em acordo: o estado sem divergência. */
function projetoConsistente(): string {
  const raiz = projetoComSkills();
  for (const n of CONJUNTO_MATTPOCOCK) {
    mkdirSync(join(raiz, ".claude", "skills", n), { recursive: true });
    writeFileSync(join(raiz, ".claude", "skills", n, "SKILL.md"), `---\nname: ${n}\n---\ncorpo\n`);
  }
  escreverLock(raiz, CONJUNTO_MATTPOCOCK);
  return raiz;
}

describe("AC-024 — o doctor enumera os conjuntos", () => {
  // SPECSFY: US-021 FR-024 AC-024
  it("nomeia cada conjunto", () => {
    const nomes = reportSkills(projetoConsistente()).results.map((r) => r.name).sort();
    expect(nomes).toEqual([...CONJUNTO_MATTPOCOCK].sort());
  });

  // SPECSFY: US-021 FR-024 AC-024
  it("nomeia a origem de cada um", () => {
    for (const r of reportSkills(projetoConsistente()).results) expect(r.origin).toBe("mattpocock/skills");
  });

  // SPECSFY: US-021 FR-024 AC-024
  it("sai com zero quando nada divergiu", () => {
    expect(reportSkills(projetoConsistente()).exitCode).toBe(0);
  });
});
