import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { arvore, projeto, decisaoFixa } from "./aprovacao-fixtures";

describe("AC-061 — a negativa impede a escrita", () => {
  // SPECSFY: US-060 FR-060 NFR-060 AC-061
  it("nenhum arquivo é criado ou alterado", () => {
    const raiz = projeto();
    const antes = arvore(raiz);
    runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, approval: { source: decisaoFixa(false) } });
    expect(arvore(raiz)).toEqual(antes);
  });

  // SPECSFY: US-060 FR-060 NFR-060 AC-061
  it("o relato informa que nada foi escrito por falta de aprovação", () => {
    const raiz = projeto();
    const r = runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, approval: { source: decisaoFixa(false) } });
    expect(r.report).toMatch(/recusad|aprova/i);
  });

  // SPECSFY: US-060 NFR-060 AC-061
  it("o exit code reflete a ausência de execução", () => {
    const raiz = projeto();
    const r = runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, approval: { source: decisaoFixa(false) } });
    expect(r.exitCode).not.toBe(0);
  });
});
