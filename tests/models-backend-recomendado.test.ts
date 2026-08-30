import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backendsFake, capacidadeFake, ollamaAusente } from "./models-fixtures";

describe("AC-090 — backend suportado presente é recomendado", () => {
  // SPECSFY: US-033 FR-034 AC-090
  it("com pi presente, o backend recomendado é pi", () => {
    const r = recommend(backendsFake(["pi"]), ollamaAusente, capacidadeFake(0));
    expect(r.backend).toBe("pi");
    expect(r.backendOverridden).toBe(false);
  });
});
