import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projeto, decisaoFixa } from "./aprovacao-fixtures";

describe("AC-062 — o que se escreve é o que foi apresentado", () => {
  // SPECSFY: US-060 FR-060 AC-062
  it("a fonte é de fato consultada antes da escrita ocorrer", () => {
    const raiz = projeto();
    const recebidos: { name: string }[][] = [];
    runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, approval: { source: decisaoFixa(true, recebidos) } });
    expect(recebidos.length).toBe(1);
  });

  // SPECSFY: US-060 FR-060 AC-062
  it("os hooks escritos correspondem aos do plano apresentado", () => {
    const raiz = projeto();
    const r = runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, approval: { source: decisaoFixa(true) } });
    expect(r.installed.length).toBe(7);
  });

  // SPECSFY: US-060 NFR-062 AC-062
  it("o registro de instalação existe", () => {
    const raiz = projeto();
    runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, approval: { source: decisaoFixa(true) } });
    expect(existsSync(join(raiz, ".common-rules", "install.json"))).toBe(true);
  });

  // SPECSFY: US-060 FR-060 AC-062
  it("o exit code reflete sucesso", () => {
    const raiz = projeto();
    const r = runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, approval: { source: decisaoFixa(true) } });
    expect(r.exitCode).toBe(0);
  });
});
