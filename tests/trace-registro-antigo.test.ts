import { describe, it, expect } from "vitest";
import { inspectDependencies } from "../src/doctor";
import { projeto, gravarRegistro, registroAntigo, arvore } from "./trace-fixtures";

const ambiente = { resolveNpm: () => "1.0.0", resolveLocalPython: () => "2.3.7", resolveOnPath: () => null };

function semTrace(): string {
  const raiz = projeto();
  gravarRegistro(raiz, registroAntigo());
  return raiz;
}

describe("AC-047 — um registro gravado antes desta fatia é lido", () => {
  // SPECSFY: US-041 FR-045 AC-047
  it("a leitura ocorre sem erro", () => {
    expect(() => inspectDependencies(ambiente, semTrace())).not.toThrow();
  });

  // SPECSFY: US-041 FR-044 AC-047
  it("o relato informa que a execução não foi identificada", () => {
    expect(inspectDependencies(ambiente, semTrace()).trace?.kind).toBe("unidentified");
  });

  // SPECSFY: US-041 NFR-042 AC-047
  it("nada no disco é alterado pela leitura", () => {
    const raiz = semTrace();
    const antes = arvore(raiz);
    inspectDependencies(ambiente, raiz);
    expect(arvore(raiz)).toEqual(antes);
  });
});
