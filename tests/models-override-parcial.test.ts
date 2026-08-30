import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backendsFake, modeloFake, capacidadeFake, ollamaPresente } from "./models-fixtures";

describe("AC-100 — override parcial combina escolha humana com cálculo do restante", () => {
  // SPECSFY: US-034 FR-034 FR-036 AC-100
  it("informando só o backend, o modelo local segue calculado, não override", () => {
    const modelos = [modeloFake("qwen2.5:3b", 2)];
    const r = recommend(backendsFake(["pi", "claude"]), ollamaPresente(modelos), capacidadeFake(10), {
      backend: "claude",
    });
    expect(r.backend).toBe("claude");
    expect(r.backendOverridden).toBe(true);
    expect(r.localModel).toBe("qwen2.5:3b");
    expect(r.localModelOverridden).toBe(false);
  });
});
