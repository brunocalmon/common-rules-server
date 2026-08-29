import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projeto, origemFixa, INSTANTE_FIXO, EPOCA } from "./trace-fixtures";

const reg = () => {
  const raiz = projeto();
  runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, trace: origemFixa() });
  return JSON.parse(readFileSync(join(raiz, ".common-rules", "install.json"), "utf8"));
};

describe("AC-042 — o carimbo corresponde ao momento da execução", () => {
  // SPECSFY: US-041 FR-042 AC-042
  it("o instante gravado é o do relógio injetado", () => {
    for (const h of reg()["hooks"]) expect(h.installedAt).toBe(INSTANTE_FIXO);
  });

  // SPECSFY: US-041 FR-042 AC-042
  it("o instante gravado não é a época", () => {
    for (const h of reg()["hooks"]) expect(h.installedAt).not.toBe(EPOCA);
  });

  // SPECSFY: US-041 FR-042 AC-042
  it("todas as entradas trazem o mesmo instante", () => {
    const instantes = new Set(reg()["hooks"].map((h: { installedAt: string }) => h.installedAt));
    expect(instantes.size).toBe(1);
  });
});
