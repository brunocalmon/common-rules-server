import { describe, it, expect } from "vitest";
import { generateId, TRACE_ID_LENGTH } from "../src/telemetry/trace";

describe("AC-054 — o valor produzido tem forma previsível", () => {
  // SPECSFY: US-042 FR-040 AC-054
  it("tem comprimento fixo", () => {
    for (let i = 0; i < 50; i++) expect(generateId().length).toBe(TRACE_ID_LENGTH);
  });

  // SPECSFY: US-042 NFR-041 AC-054
  it("usa apenas caracteres hexadecimais", () => {
    for (let i = 0; i < 50; i++) expect(generateId()).toMatch(/^[0-9a-f]+$/);
  });

  // SPECSFY: US-042 FR-040 NFR-041 AC-054
  it("o comprimento declarado é o que a implementação produz", () => {
    expect(TRACE_ID_LENGTH).toBeGreaterThanOrEqual(16);
    expect(generateId().length).toBe(TRACE_ID_LENGTH);
  });
});
