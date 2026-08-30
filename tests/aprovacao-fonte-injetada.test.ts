import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projeto, decisaoFixa } from "./aprovacao-fixtures";

describe("AC-071 — a decisão vem de onde o caso mandar", () => {
  // SPECSFY: US-062 FR-065 NFR-061 AC-071
  it("duas execuções com fontes sempre aprovando escrevem, sobre projetos distintos", () => {
    const raizA = projeto("crs-ap-a-");
    const raizB = projeto("crs-ap-b-");
    const a = runSetup({ env: detectEnvironment(raizA), root: raizA, write: true, approval: { source: decisaoFixa(true) } });
    const b = runSetup({ env: detectEnvironment(raizB), root: raizB, write: true, approval: { source: decisaoFixa(true) } });
    expect(a.exitCode).toBe(0);
    expect(b.exitCode).toBe(0);
  });

  // SPECSFY: US-062 NFR-061 AC-071
  it("cada chamada usa a fonte que lhe foi passada, não uma global compartilhada", () => {
    const raizA = projeto("crs-ap-a2-");
    const raizB = projeto("crs-ap-b2-");
    const ra = runSetup({ env: detectEnvironment(raizA), root: raizA, write: true, approval: { source: decisaoFixa(true) } });
    const rb = runSetup({ env: detectEnvironment(raizB), root: raizB, write: true, approval: { source: decisaoFixa(false) } });
    expect(ra.exitCode).toBe(0);
    expect(rb.exitCode).not.toBe(0);
  });

  // SPECSFY: US-062 FR-065 AC-071
  it("a fonte injetada é a que decide, e é consultada de fato", () => {
    const raizA = projeto("crs-ap-a3-");
    const recebidos: { name: string }[][] = [];
    runSetup({ env: detectEnvironment(raizA), root: raizA, write: true, approval: { source: decisaoFixa(true, recebidos) } });
    expect(recebidos.length).toBe(1);
  });
});
