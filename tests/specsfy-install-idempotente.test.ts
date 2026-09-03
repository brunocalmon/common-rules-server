import { describe, it, expect } from "vitest";
import { installSpecsfy } from "../src/specsfy/install";

describe("AC-039 — rerunning doesn't fail or duplicate", () => {
  // SPECSFY: US-023 FR-028 FR-029 NFR-020 AC-039
  it("a second call with nothing to do doesn't throw or fail", () => {
    const execute = () => ({ status: 0, changed: 0, paths: [] });
    const r1 = installSpecsfy({ root: "/x", execute });
    const r2 = installSpecsfy({ root: "/x", execute });
    expect(r1.isError).toBe(false);
    expect(r2.isError).toBe(false);
    expect(r2.changed).toBe(0);
  });
});

describe("AC-041 — nothing changed is reported as nothing changed", () => {
  // SPECSFY: US-023 FR-029 NFR-021 AC-041
  it("changed:0 doesn't turn into an installation report", () => {
    const execute = () => ({ status: 0, changed: 0, paths: [] });
    const r = installSpecsfy({ root: "/x", execute });
    expect(r.report).toBe("specsfy was already up to date");
    expect(r.changed).toBe(0);
  });
});
