import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projeto, decisaoFixa } from "./aprovacao-fixtures";

describe("AC-060 — o plano chega a quem decide antes de qualquer escrita", () => {
  // SPECSFY: US-060 FR-060 AC-060
  it("a fonte recebe o plano antes de o comando escrever", () => {
    const raiz = projeto();
    const recebidos: { name: string; target: string; event: string }[][] = [];
    runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, approval: { source: decisaoFixa(true, recebidos) } });
    expect(recebidos.length).toBe(1);
  });

  // SPECSFY: US-060 FR-063 FR-065 AC-060
  it("o plano descreve cada hook com nome, destino e evento", () => {
    const raiz = projeto();
    const recebidos: { name: string; target: string; event: string }[][] = [];
    runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, approval: { source: decisaoFixa(true, recebidos) } });
    expect(recebidos[0]?.length).toBe(7);
    for (const item of recebidos[0] ?? []) {
      expect(typeof item.name).toBe("string");
      expect(typeof item.target).toBe("string");
      expect(typeof item.event).toBe("string");
    }
  });

  // SPECSFY: US-060 FR-060 AC-060
  it("a fonte é consultada uma única vez", () => {
    const raiz = projeto();
    const recebidos: { name: string; target: string; event: string }[][] = [];
    runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, approval: { source: decisaoFixa(true, recebidos) } });
    expect(recebidos.length).toBe(1);
  });
});
