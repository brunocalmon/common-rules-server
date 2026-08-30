import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backendsFake, capacidadeFake, ollamaAusente } from "./models-fixtures";

describe("AC-091 — nenhum backend presente é comunicado, não inventado", () => {
  // SPECSFY: US-033 FR-034 AC-091
  it("com nenhum backend suportado presente, o backend recomendado é nulo", () => {
    const r = recommend(backendsFake([]), ollamaAusente, capacidadeFake(0));
    expect(r.backend).toBeNull();
    expect(r.report).toMatch(/nenhum backend suportado/i);
  });
});
