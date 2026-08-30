import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backendsFake, modeloFake, capacidadeFake, ollamaPresente } from "./models-fixtures";

describe("AC-096 — override de modelo local é respeitado, não recalculado", () => {
  // SPECSFY: US-034 FR-036 AC-096
  it("com um modelo de 9GB e 2GB livres, informar esse modelo o recomenda mesmo sem caber", () => {
    const modelos = [modeloFake("cogito:14b", 9)];
    const r = recommend(backendsFake([]), ollamaPresente(modelos), capacidadeFake(2), {
      localModel: "cogito:14b",
    });
    expect(r.localModel).toBe("cogito:14b");
    expect(r.localModelOverridden).toBe(true);
  });
});
