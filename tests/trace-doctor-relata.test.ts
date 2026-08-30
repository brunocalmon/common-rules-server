import { describe, it, expect } from "vitest";
import { inspectDependencies } from "../src/doctor";
import { projeto, gravarRegistro, registroAntigo, ID_FIXO } from "./trace-fixtures";
import { semBackends } from "./backends-fixtures";

const ambiente = { resolveNpm: () => "1.0.0", resolveLocalPython: () => "2.3.7", resolveOnPath: () => null };

function relatorio(raiz: string) {
  return inspectDependencies(ambiente, raiz, semBackends);
}

describe("AC-046 — o identificador aparece no diagnóstico", () => {
  const comTrace = () => {
    const raiz = projeto();
    gravarRegistro(raiz, { ...registroAntigo(), trace: ID_FIXO });
    return raiz;
  };

  // SPECSFY: US-040 FR-044 AC-046
  it("o relato nomeia o identificador registrado", () => {
    expect(relatorio(comTrace()).trace?.kind).toBe("identified");
  });

  // SPECSFY: US-040 FR-041 AC-046
  it("o valor nomeado é o do registro", () => {
    const t = relatorio(comTrace()).trace;
    expect(t?.kind === "identified" ? t.trace : null).toBe(ID_FIXO);
  });

  // SPECSFY: US-040 FR-044 AC-046
  it("o relato das dependências permanece", () => {
    expect(relatorio(comTrace()).results.length).toBeGreaterThan(0);
  });
});
