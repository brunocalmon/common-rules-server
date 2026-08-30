import { describe, it, expect } from "vitest";
import { detectBackends } from "../src/backends/detect";
import { fonteFake } from "./backends-fixtures";

describe("AC-083 — a lista suportada é fixa, não descoberta em produção", () => {
  // SPECSFY: US-030 FR-032 NFR-030 AC-083
  it("nenhuma chamada além da que resolve presença/versão ocorre", () => {
    const { env, chamadas } = fonteFake({ pi: "0.84.3" });
    detectBackends(env);
    expect(chamadas.length).toBeGreaterThan(0);
    for (const c of chamadas) expect(["presence", "version"]).toContain(c.tipo);
  });
});
