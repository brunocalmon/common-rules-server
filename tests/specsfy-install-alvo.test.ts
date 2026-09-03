import { describe, it, expect } from "vitest";
import { installSpecsfy } from "../src/specsfy/install";

describe("AC-038 — installSpecsfy returns a structured result", () => {
  // SPECSFY: US-023 FR-028 AC-038
  it("a successful executor returns changed and paths, with no error", () => {
    const calls: string[] = [];
    const execute = (root: string) => {
      calls.push(root);
      return { status: 0, changed: 34, paths: ["/x/CLAUDE.md", "/x/AGENTS.md"] };
    };
    const r = installSpecsfy({ root: "/x", execute });
    expect(r.isError).toBe(false);
    expect(r.changed).toBe(34);
    expect(r.paths).toEqual(["/x/CLAUDE.md", "/x/AGENTS.md"]);
    expect(calls).toEqual(["/x"]);
  });
});
