import { describe, it, expect } from "vitest";
import { installSpecsfy } from "../src/specsfy/install";

describe("AC-040 — an absent Specsfy installer doesn't become success", () => {
  // SPECSFY: US-023 FR-028 NFR-021 AC-040
  it("a null executor (missing binary) is an error, not success", () => {
    const execute = () => null;
    const r = installSpecsfy({ root: "/x", execute });
    expect(r.isError).toBe(true);
    expect(r.report).toMatch(/framework/i);
    expect(r.report).not.toMatch(/installed successfully/i);
  });

  // SPECSFY: US-023 FR-028 NFR-021 AC-040
  it("a non-zero status is an error, not success", () => {
    const execute = () => ({ status: 1 });
    const r = installSpecsfy({ root: "/x", execute });
    expect(r.isError).toBe(true);
    expect(r.report).toMatch(/framework/i);
  });
});
