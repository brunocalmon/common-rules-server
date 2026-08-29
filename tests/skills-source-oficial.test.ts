import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveSource, OFFICIAL_SOURCE } from "../src/skills/source";
import { toRecordEntries, readLock } from "../src/skills/record";
import { projetoComSkills, escreverLock, CONJUNTO_MATTPOCOCK } from "./skills-fixtures";

describe("AC-034 — a origem gravada no registro é a oficial", () => {
  // SPECSFY: US-021 FR-025 AC-034
  it("a origem oficial é aceita", () => {
    expect(resolveSource(OFFICIAL_SOURCE).ok).toBe(true);
  });

  // SPECSFY: US-021 FR-023 AC-034
  it("as entradas do registro trazem a origem lida do lockfile", () => {
    const raiz = projetoComSkills();
    escreverLock(raiz, CONJUNTO_MATTPOCOCK);
    const entradas = toRecordEntries(readLock(raiz));
    expect(entradas).toHaveLength(CONJUNTO_MATTPOCOCK.length);
    for (const e of entradas) expect(e.source).toBe(OFFICIAL_SOURCE);
  });

  // SPECSFY: US-021 FR-023 FR-025 AC-034
  it("nenhuma outra origem aparece no registro", () => {
    const raiz = projetoComSkills();
    escreverLock(raiz, CONJUNTO_MATTPOCOCK);
    const bruto = JSON.parse(readFileSync(join(raiz, "skills-lock.json"), "utf8"));
    const origens = new Set(Object.values<{ source: string }>(bruto.skills).map((s) => s.source));
    expect([...origens]).toEqual([OFFICIAL_SOURCE]);
  });
});
