import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { arvore, projeto } from "./aprovacao-fixtures";

const rodarCom = (raiz: string, texto: string) => runSetup({
  env: detectEnvironment(raiz), root: raiz, write: true,
  approval: { context: { hasTerminal: () => false }, stdin: { read: () => texto } },
});

describe("AC-068 — entrada vazia não autoriza", () => {
  // SPECSFY: US-061 FR-064 NFR-060 AC-068
  it("a decisão é tratada como negativa", () => {
    const raiz = projeto();
    expect(rodarCom(raiz, "").exitCode).not.toBe(0);
  });

  // SPECSFY: US-061 FR-064 NFR-060 AC-068
  it("nenhum arquivo é criado", () => {
    const raiz = projeto();
    const antes = arvore(raiz);
    rodarCom(raiz, "");
    expect(arvore(raiz)).toEqual(antes);
  });

  // SPECSFY: US-061 FR-064 AC-068
  it("entrada só com espaço em branco também é negativa", () => {
    const raiz = projeto();
    expect(rodarCom(raiz, "   \n  ").exitCode).not.toBe(0);
  });
});
