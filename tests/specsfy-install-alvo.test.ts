import { describe, it, expect } from "vitest";
import { installSpecsfy } from "../src/specsfy/install";

describe("AC-038 — installSpecsfy devolve resultado estruturado", () => {
  // SPECSFY: US-023 FR-028 AC-038
  it("executor com sucesso devolve changed e paths, sem erro", () => {
    const chamadas: string[] = [];
    const execute = (raiz: string) => {
      chamadas.push(raiz);
      return { status: 0, changed: 34, paths: ["/x/CLAUDE.md", "/x/AGENTS.md"] };
    };
    const r = installSpecsfy({ root: "/x", execute });
    expect(r.isError).toBe(false);
    expect(r.changed).toBe(34);
    expect(r.paths).toEqual(["/x/CLAUDE.md", "/x/AGENTS.md"]);
    expect(chamadas).toEqual(["/x"]);
  });
});
