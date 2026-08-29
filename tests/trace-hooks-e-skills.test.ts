import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { origemFixa, INSTANTE_FIXO, ID_FIXO } from "./trace-fixtures";
import { projetoComSkills, executorFalso } from "./skills-fixtures";

function registroCompleto(): Record<string, any> {
  const raiz = projetoComSkills("crs-tr-sk-");
  runSetup({
    env: detectEnvironment(raiz), root: raiz, write: true,
    trace: origemFixa(),
    skills: { execute: executorFalso("sucesso", raiz).fn },
  });
  return JSON.parse(readFileSync(join(raiz, ".common-rules", "install.json"), "utf8"));
}

describe("AC-051 — as duas listas do registro apontam a mesma execução", () => {
  // SPECSFY: US-040 FR-040 AC-051
  it("o registro traz o identificador uma vez, para a execução inteira", () => {
    expect(registroCompleto()["trace"]).toBe(ID_FIXO);
  });

  // SPECSFY: US-040 FR-041 AC-051
  it("hooks e skills compartilham o mesmo instante", () => {
    const reg = registroCompleto();
    const instantes = new Set([
      ...reg["hooks"].map((h: { installedAt: string }) => h.installedAt),
      ...reg["skills"].map((s: { installedAt: string }) => s.installedAt),
    ]);
    expect([...instantes]).toEqual([INSTANTE_FIXO]);
  });

  // SPECSFY: US-040 FR-040 AC-051
  it("as duas listas existem no mesmo registro", () => {
    const reg = registroCompleto();
    expect(reg["hooks"].length).toBe(7);
    expect(reg["skills"].length).toBeGreaterThan(0);
  });
});
