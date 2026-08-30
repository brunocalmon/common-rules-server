import { describe, it, expect } from "vitest";
import { installSpecsfy } from "../src/specsfy/install";

describe("AC-040 — instalador do Specsfy ausente não vira sucesso", () => {
  // SPECSFY: US-023 FR-028 NFR-021 AC-040
  it("executor nulo (binário ausente) é erro, não sucesso", () => {
    const execute = () => null;
    const r = installSpecsfy({ root: "/x", execute });
    expect(r.isError).toBe(true);
    expect(r.report).toMatch(/framework/i);
    expect(r.report).not.toMatch(/instalado com sucesso/i);
  });

  // SPECSFY: US-023 FR-028 NFR-021 AC-040
  it("status diferente de zero é erro, não sucesso", () => {
    const execute = () => ({ status: 1 });
    const r = installSpecsfy({ root: "/x", execute });
    expect(r.isError).toBe(true);
    expect(r.report).toMatch(/framework/i);
  });
});
