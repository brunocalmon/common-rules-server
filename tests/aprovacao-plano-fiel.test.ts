import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projeto, decisaoFixa } from "./aprovacao-fixtures";

describe("AC-070 — nada é escrito fora do que o plano previa", () => {
  const executar = () => {
    const raiz = projeto();
    const recebidos: { name: string }[][] = [];
    const r = runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, approval: { source: decisaoFixa(true, recebidos) } });
    return { plano: recebidos[0] ?? [], instalado: r.installed };
  };

  // SPECSFY: US-060 NFR-062 AC-070
  it("cada arquivo escrito corresponde a um item do plano", () => {
    const { plano, instalado } = executar();
    const nomesPlano = new Set(plano.map((p) => p.name));
    for (const h of instalado) expect(nomesPlano.has(h.name)).toBe(true);
  });

  // SPECSFY: US-060 NFR-062 AC-070
  it("nenhum item do plano ficou por escrever", () => {
    const { plano, instalado } = executar();
    const nomesInstalados = new Set(instalado.map((h) => h.name));
    for (const p of plano) expect(nomesInstalados.has(p.name)).toBe(true);
  });

  // SPECSFY: US-060 NFR-062 AC-070
  it("a quantidade coincide exatamente", () => {
    const { plano, instalado } = executar();
    expect(instalado.length).toBe(plano.length);
  });
});
