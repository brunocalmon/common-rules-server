import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projeto, origemFixa, ID_FIXO } from "./trace-fixtures";

function registroDe(raiz: string): Record<string, any> {
  runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, trace: origemFixa() });
  return JSON.parse(readFileSync(join(raiz, ".common-rules", "install.json"), "utf8"));
}

describe("AC-040 — todas as entradas da mesma execução compartilham o identificador", () => {
  // SPECSFY: US-040 FR-040 AC-040
  it("o registro traz um identificador de correlação", () => {
    expect(registroDe(projeto())["trace"]).toBe(ID_FIXO);
  });

  // SPECSFY: US-040 FR-040 AC-040
  it("o identificador não é vazio nem ausente", () => {
    const t = registroDe(projeto())["trace"];
    expect(typeof t).toBe("string");
    expect(String(t).length).toBeGreaterThan(0);
  });

  // SPECSFY: US-040 FR-040 AC-040
  it("as entradas de hooks pertencem a essa execução", () => {
    const reg = registroDe(projeto());
    expect(reg["hooks"].length).toBe(7);
    for (const h of reg["hooks"]) expect(h.installedAt).toBe("2026-08-29T17:45:00.000Z");
  });
});
