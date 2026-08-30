import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backendsFake, capacidadeFake, ollamaAusente } from "./models-fixtures";

describe("AC-094 — ollama ausente é comunicado", () => {
  // SPECSFY: US-033 FR-035 AC-094
  it("com ollama ausente, o modelo local recomendado é nulo", () => {
    const r = recommend(backendsFake([]), ollamaAusente, capacidadeFake(10));
    expect(r.localModel).toBeNull();
    expect(r.report).toMatch(/ollama não foi encontrado/i);
  });
});
