import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backendsFake, modeloFake, capacidadeFake, ollamaPresente, ollamaAusente } from "./models-fixtures";

describe("AC-098 — o módulo aceita fontes injetadas, sem tocar rede nem máquina real", () => {
  // SPECSFY: US-035 FR-037 NFR-033 NFR-034 NFR-035 AC-098
  it("o resultado reflete exatamente as fontes fake, nunca a máquina onde a suíte roda", () => {
    const modelos = [modeloFake("qwen2.5:3b", 2)];
    const r = recommend(backendsFake(["pi"]), ollamaPresente(modelos), capacidadeFake(10));
    expect(r.backend).toBe("pi");
    expect(r.localModel).toBe("qwen2.5:3b");
    expect(r.freeBytesConsidered).toBe(10 * 1_000_000_000);
  });

  // SPECSFY: FR-037 NFR-035 AC-098
  it("o relato declara que custo e uso de plano não entram no cálculo", () => {
    const r = recommend(backendsFake(["pi"]), ollamaAusente, capacidadeFake(0));
    expect(r.report).toMatch(/custo|uso de plano/i);
    expect(r.report).toMatch(/não entra/i);
  });
});
