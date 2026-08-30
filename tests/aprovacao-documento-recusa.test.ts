import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { arvore, projeto } from "./aprovacao-fixtures";

describe("AC-066 — o documento nega a execução", () => {
  const rodar = (raiz: string) => runSetup({
    env: detectEnvironment(raiz), root: raiz, write: true,
    approval: { context: { hasTerminal: () => false }, stdin: { read: () => '{"approved": false}' } },
  });

  // SPECSFY: US-061 FR-062 FR-064 AC-066
  it("nenhum arquivo é criado", () => {
    const raiz = projeto();
    const antes = arvore(raiz);
    rodar(raiz);
    expect(arvore(raiz)).toEqual(antes);
  });

  // SPECSFY: US-061 FR-064 AC-066
  it("o relato informa a recusa", () => {
    const raiz = projeto();
    expect(rodar(raiz).report).toMatch(/recusad|aprova/i);
  });

  // SPECSFY: US-061 FR-062 AC-066
  it("o exit code não é de sucesso", () => {
    const raiz = projeto();
    expect(rodar(raiz).exitCode).not.toBe(0);
  });
});
