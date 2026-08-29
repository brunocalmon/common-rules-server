import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projeto, EPOCA } from "./trace-fixtures";

/** Sem injeção: a origem real é a que responde. */
function semInjecao(): Record<string, any> {
  const raiz = projeto();
  runSetup({ env: detectEnvironment(raiz), root: raiz, write: true });
  return JSON.parse(readFileSync(join(raiz, ".common-rules", "install.json"), "utf8"));
}

describe("AC-050 — a ausência de injeção não deixa o valor constante", () => {
  // SPECSFY: US-042 FR-042 AC-050
  it("o instante gravado é posterior à época", () => {
    const t = semInjecao()["hooks"][0].installedAt;
    expect(Date.parse(t)).toBeGreaterThan(Date.parse(EPOCA));
  });

  // SPECSFY: US-042 FR-043 AC-050
  it("o identificador não é vazio", () => {
    expect(String(semInjecao()["trace"] ?? "").length).toBeGreaterThan(0);
  });

  // SPECSFY: US-042 NFR-040 AC-050
  it("duas execuções sem injeção recebem identificadores distintos", () => {
    expect(semInjecao()["trace"]).not.toBe(semInjecao()["trace"]);
  });
});
