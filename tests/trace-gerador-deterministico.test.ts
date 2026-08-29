import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projeto, origemFixa } from "./trace-fixtures";

function traceCom(id: string): string {
  const raiz = projeto();
  runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, trace: origemFixa(id) });
  return JSON.parse(readFileSync(join(raiz, ".common-rules", "install.json"), "utf8"))["trace"];
}

describe("AC-044 — o identificador vem do gerador informado", () => {
  // SPECSFY: US-042 FR-043 AC-044
  it("o valor gravado é exatamente o do gerador", () => {
    expect(traceCom("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")).toBe("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });

  // SPECSFY: US-042 NFR-040 AC-044
  it("outro gerador produz outro valor gravado", () => {
    expect(traceCom("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")).toBe("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
  });

  // SPECSFY: US-042 FR-043 NFR-040 AC-044
  it("a injeção substitui a origem real por completo", () => {
    const a = traceCom("cccccccccccccccccccccccccccccccc");
    const b = traceCom("cccccccccccccccccccccccccccccccc");
    expect(a).toBe(b);
  });
});
