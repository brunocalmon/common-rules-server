import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projeto, origemFixa, INSTANTE_FIXO } from "./trace-fixtures";

function instanteDe(raiz: string): string {
  runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, trace: origemFixa() });
  const reg = JSON.parse(readFileSync(join(raiz, ".common-rules", "install.json"), "utf8"));
  return reg["hooks"][0].installedAt;
}

describe("AC-043 — duas execuções com o mesmo relógio gravam o mesmo instante", () => {
  // SPECSFY: US-042 FR-043 AC-043
  it("projetos distintos recebem o mesmo instante", () => {
    expect(instanteDe(projeto("crs-a-"))).toBe(instanteDe(projeto("crs-b-")));
  });

  // SPECSFY: US-042 NFR-040 AC-043
  it("o valor é o injetado, e não o do relógio da máquina", () => {
    expect(instanteDe(projeto())).toBe(INSTANTE_FIXO);
  });

  // SPECSFY: US-042 FR-043 NFR-040 AC-043
  it("o caso não depende do relógio real", () => {
    const antes = instanteDe(projeto());
    const depois = instanteDe(projeto());
    expect(antes).toBe(depois);
  });
});
