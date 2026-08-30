import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backendsFake, modeloFake, capacidadeFake, ollamaPresente } from "./models-fixtures";

describe("AC-092 — maior modelo local que cabe na memória livre é recomendado", () => {
  // SPECSFY: US-033 FR-035 AC-092
  it("com modelos de 2GB e 9GB e 10GB livres, recomenda o de 9GB", () => {
    const modelos = [modeloFake("qwen2.5:3b", 2), modeloFake("cogito:14b", 9)];
    const r = recommend(backendsFake([]), ollamaPresente(modelos), capacidadeFake(10));
    expect(r.localModel).toBe("cogito:14b");
    expect(r.localModelOverridden).toBe(false);
  });
});
