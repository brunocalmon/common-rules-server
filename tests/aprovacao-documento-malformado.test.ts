import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { arvore, projeto } from "./aprovacao-fixtures";

const rodarCom = (raiz: string, texto: string) => runSetup({
  env: detectEnvironment(raiz), root: raiz, write: true,
  approval: { context: { hasTerminal: () => false }, stdin: { read: () => texto } },
});

describe("AC-067 — texto que não é JSON válido não aprova", () => {
  // SPECSFY: US-061 FR-062 FR-064 NFR-060 AC-067
  it("a decisão é tratada como negativa", () => {
    const raiz = projeto();
    expect(rodarCom(raiz, "isto claramente não é json {{{").exitCode).not.toBe(0);
  });

  // SPECSFY: US-061 FR-064 NFR-060 AC-067
  it("nenhum arquivo é criado", () => {
    const raiz = projeto();
    const antes = arvore(raiz);
    rodarCom(raiz, "isto claramente não é json {{{");
    expect(arvore(raiz)).toEqual(antes);
  });

  // SPECSFY: US-061 FR-062 FR-064 AC-067
  it("JSON válido mas sem forma de objeto também é negativa", () => {
    const raiz = projeto();
    expect(rodarCom(raiz, "42").exitCode).not.toBe(0);
  });
});
