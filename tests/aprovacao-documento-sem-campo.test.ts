import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { arvore, projeto } from "./aprovacao-fixtures";

const rodarCom = (raiz: string, texto: string) => runSetup({
  env: detectEnvironment(raiz), root: raiz, write: true,
  approval: { context: { hasTerminal: () => false }, stdin: { read: () => texto } },
});

describe("Caso-limite — JSON válido, objeto, sem o campo de decisão", () => {
  // SPECSFY: US-061 FR-062 AC-067
  it("um objeto vazio é negativa", () => {
    const raiz = projeto();
    expect(rodarCom(raiz, "{}").exitCode).not.toBe(0);
  });

  // SPECSFY: US-061 FR-064 NFR-060 AC-067
  it("nenhum arquivo é criado", () => {
    const raiz = projeto();
    const antes = arvore(raiz);
    rodarCom(raiz, "{}");
    expect(arvore(raiz)).toEqual(antes);
  });

  // SPECSFY: US-061 FR-064 AC-067
  it("um objeto com outros campos, mas sem approved, também é negativa", () => {
    const raiz = projeto();
    expect(rodarCom(raiz, '{"comentario": "aprovado no chat"}').exitCode).not.toBe(0);
  });
});
