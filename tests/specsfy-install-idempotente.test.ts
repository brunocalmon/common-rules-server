import { describe, it, expect } from "vitest";
import { installSpecsfy } from "../src/specsfy/install";

describe("AC-039 — reexecução não falha nem duplica", () => {
  // SPECSFY: US-023 FR-028 FR-029 NFR-020 AC-039
  it("segunda chamada sobre nada a fazer não lança nem falha", () => {
    const execute = () => ({ status: 0, changed: 0, paths: [] });
    const r1 = installSpecsfy({ root: "/x", execute });
    const r2 = installSpecsfy({ root: "/x", execute });
    expect(r1.isError).toBe(false);
    expect(r2.isError).toBe(false);
    expect(r2.changed).toBe(0);
  });
});

describe("AC-041 — nada mudou é relatado como nada mudou", () => {
  // SPECSFY: US-023 FR-029 NFR-021 AC-041
  it("changed:0 não vira relato de instalação", () => {
    const execute = () => ({ status: 0, changed: 0, paths: [] });
    const r = installSpecsfy({ root: "/x", execute });
    expect(r.report).toBe("specsfy já estava atualizado");
    expect(r.changed).toBe(0);
  });
});
