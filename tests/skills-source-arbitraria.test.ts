import { describe, it, expect } from "vitest";
import { resolveSource } from "../src/skills/source";

describe("AC-035 — origem que não a oficial é recusada", () => {
  // SPECSFY: US-022 FR-025 AC-035
  it("recusa mais de uma forma de origem inválida", () => {
    for (const origem of ["https://exemplo.invalido/skills", "../fora", "outro/repo", ""]) {
      expect(resolveSource(origem).ok).toBe(false);
    }
  });

  // SPECSFY: US-022 FR-025 AC-035
  it("explica que a origem não é reconhecida", () => {
    const r = resolveSource("outro/repo");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/não reconhecid/i);
  });

  // SPECSFY: US-022 NFR-021 AC-035
  it("recusa entrada que não é texto, sem lançar", () => {
    for (const v of [undefined, null, 42, {}]) expect(resolveSource(v).ok).toBe(false);
  });
});
