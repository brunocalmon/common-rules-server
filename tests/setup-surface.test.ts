import { describe, it, expect } from "vitest";
import { COMMANDS } from "../src/cli";

const PROIBIDOS = ["mcp", "serve", "approve", "agent", "model", "orchestrate"];

describe("AC-011 — a fatia não entrega capacidade de outra", () => {
  // SPECSFY: US-001 US-003 FR-001 AC-011
  it("oferece identificação de versão, verificação e configuração", () => {
    expect(Object.keys(COMMANDS).sort()).toEqual(["doctor", "setup", "version"]);
  });

  // SPECSFY: US-001 FR-005 AC-011
  it("não oferece nenhuma superfície das fatias seguintes", () => {
    expect(Object.keys(COMMANDS).filter((c) => PROIBIDOS.includes(c))).toEqual([]);
  });

  // SPECSFY: US-003 FR-001 AC-011
  it("expõe a configuração como função despachável", () => {
    expect(COMMANDS.setup).toBeTypeOf("function");
  });
});
