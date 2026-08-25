import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Versões verificadas contra o registro npm em 2026-08-24.
const PINNED: Record<string, string> = {
  "@promovaweb/specsfy": "0.10.2",
  "context-mode": "1.0.169",
};

const deps = () =>
  JSON.parse(readFileSync(resolve(__dirname, "../package.json"), "utf8")).dependencies ?? {};

describe("AC-007 — versões fixas, sem faixa", () => {
  for (const [name, version] of Object.entries(PINNED)) {
    // SPECSFY: US-001 FR-004 NFR-002 AC-007
    it(`fixa ${name} em ${version}, exatamente`, () => {
      expect(deps()[name]).toBe(version);
    });
  }

  // SPECSFY: US-001 FR-004 NFR-002 AC-007
  it("não fixa o agente pi, que pertence à camada de backends", () => {
    // A guarda impede que a ausência de pi seja verdadeira só porque nenhuma
    // dependência foi declarada ainda.
    expect(Object.keys(deps()).length).toBeGreaterThan(0);
    expect(deps()["@earendil-works/pi-coding-agent"]).toBeUndefined();
  });
});
