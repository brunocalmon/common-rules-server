import { describe, it, expect } from "vitest";
import { detectBackends } from "../src/backends/detect";
import { fonteFake } from "./backends-fixtures";

describe("AC-087 — resolução de versão nunca interpreta --help", () => {
  // SPECSFY: FR-030 NFR-030 AC-087
  it("a única flag usada é --version; --help nunca é consultado", () => {
    const { env, chamadas } = fonteFake({ claude: "2.1.251" });
    detectBackends(env);
    expect(chamadas.some((c) => c.tipo === "version")).toBe(true);
    const tiposUsados = new Set(chamadas.map((c) => c.tipo));
    expect([...tiposUsados].sort()).toEqual(["presence", "version"]);
  });
});
