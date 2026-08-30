import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backendsFake, capacidadeFake, ollamaAusente } from "./models-fixtures";

describe("AC-095 — override de backend é respeitado, não recalculado", () => {
  // SPECSFY: US-034 FR-036 AC-095
  it("com pi e claude presentes, informar claude recomenda claude como override", () => {
    const r = recommend(backendsFake(["pi", "claude"]), ollamaAusente, capacidadeFake(0), {
      backend: "claude",
    });
    expect(r.backend).toBe("claude");
    expect(r.backendOverridden).toBe(true);
  });
});
