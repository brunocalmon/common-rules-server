import { describe, it, expect } from "vitest";
import { readTrace } from "../src/telemetry/read";
import { projeto, gravarRegistro, registroAntigo, arvore, EPOCA } from "./trace-fixtures";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function comEpoca(): string {
  const raiz = projeto();
  gravarRegistro(raiz, registroAntigo());
  return raiz;
}

describe("AC-048 — um registro com o carimbo da época é aceito na leitura", () => {
  // SPECSFY: US-041 FR-045 AC-048
  it("a leitura ocorre sem erro", () => {
    expect(() => readTrace(comEpoca())).not.toThrow();
  });

  // SPECSFY: US-041 NFR-042 AC-048
  it("as entradas permanecem como estavam", () => {
    const raiz = comEpoca();
    readTrace(raiz);
    const reg = JSON.parse(readFileSync(join(raiz, ".common-rules", "install.json"), "utf8"));
    expect(reg.hooks[0].installedAt).toBe(EPOCA);
  });

  // SPECSFY: US-041 NFR-042 AC-048
  it("a árvore não muda", () => {
    const raiz = comEpoca();
    const antes = arvore(raiz);
    readTrace(raiz);
    expect(arvore(raiz)).toEqual(antes);
  });
});
