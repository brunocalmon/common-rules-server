import { describe, it, expect } from "vitest";
import { generateId } from "../src/telemetry/trace";

describe("AC-045 — o gerador real não repete valores", () => {
  const muitos = () => Array.from({ length: 500 }, () => generateId());

  // SPECSFY: US-040 FR-040 AC-045
  it("não há valor repetido entre eles", () => {
    const v = muitos();
    expect(new Set(v).size).toBe(v.length);
  });

  // SPECSFY: US-040 NFR-041 AC-045
  it("nenhum contém caminho de arquivo", () => {
    for (const v of muitos()) expect(v).not.toMatch(/[/\\]/);
  });

  // SPECSFY: US-040 FR-040 NFR-041 AC-045
  it("dois valores seguidos diferem", () => {
    expect(generateId()).not.toBe(generateId());
  });
});
