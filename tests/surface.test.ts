import { describe, it, expect } from "vitest";
import { COMMANDS } from "../src/cli";

const PROIBIDOS = ["setup", "orchestrate", "approve", "model", "agent", "run"];

describe("AC-010 — o esqueleto não entrega capacidade de produto", () => {
  // SPECSFY: US-001 US-002 FR-005 FR-006 AC-010
  it("oferece exatamente dois comandos", () => {
    expect(Object.keys(COMMANDS).sort()).toEqual(["doctor", "version"]);
  });

  // SPECSFY: US-001 FR-005 AC-010
  it("não oferece nenhum comando das fatias seguintes", () => {
    const vazados = Object.keys(COMMANDS).filter((c) => PROIBIDOS.includes(c));
    expect(vazados).toEqual([]);
  });

  // SPECSFY: US-002 FR-006 AC-010
  it("mantém doctor como a única superfície de verificação", () => {
    expect(COMMANDS.doctor).toBeTypeOf("function");
  });
});
