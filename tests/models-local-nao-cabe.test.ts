import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backendsFake, modeloFake, capacidadeFake, ollamaPresente } from "./models-fixtures";

describe("AC-093 — nenhum modelo local cabe é comunicado, não escolhido às cegas", () => {
  // SPECSFY: US-033 FR-035 AC-093
  it("com modelo de 9GB e 2GB livres, o modelo local recomendado é nulo", () => {
    const modelos = [modeloFake("cogito:14b", 9)];
    const r = recommend(backendsFake([]), ollamaPresente(modelos), capacidadeFake(2));
    expect(r.localModel).toBeNull();
    expect(r.report).toMatch(/nenhum modelo local coube/i);
  });
});
