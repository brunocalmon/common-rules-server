import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projeto, origemFixa } from "./trace-fixtures";

describe("AC-041 — quem executou consegue nomear a execução", () => {
  const executar = () => {
    const raiz = projeto();
    const r = runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, trace: origemFixa() });
    const reg = JSON.parse(readFileSync(join(raiz, ".common-rules", "install.json"), "utf8"));
    return { relato: r.report, gravado: reg["trace"] as string };
  };

  // SPECSFY: US-040 FR-041 AC-041
  it("o relato contém o identificador gravado", () => {
    const { relato, gravado } = executar();
    expect(relato).toContain(gravado);
  });

  // SPECSFY: US-040 FR-041 AC-041
  it("o relato segue descrevendo os hooks", () => {
    expect(executar().relato).toMatch(/hooks/);
  });

  // SPECSFY: US-040 FR-041 AC-041
  it("o identificado citado é o mesmo do registro, e não um literal", () => {
    const a = executar(), b = executar();
    expect(a.relato).toContain(a.gravado);
    expect(b.relato).toContain(b.gravado);
  });
});
