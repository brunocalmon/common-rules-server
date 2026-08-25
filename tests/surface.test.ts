import { describe, it, expect } from "vitest";
import { COMMANDS } from "../src/cli";

// Comandos das fatias 1c a 1f. `setup` saiu desta lista quando a fatia 1b o
// entregou: a propriedade durável é que o esqueleto não contrabandeia
// orquestração, e não que o produto nunca cresça.
const PROIBIDOS = ["orchestrate", "approve", "model", "agent", "serve", "mcp"];

describe("AC-010 — o esqueleto não entrega capacidade de produto", () => {
  // SPECSFY: US-001 US-002 FR-005 FR-006 AC-010
  it("oferece os dois comandos que esta fatia entregou", () => {
    for (const c of ["doctor", "version"]) expect(Object.keys(COMMANDS)).toContain(c);
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
