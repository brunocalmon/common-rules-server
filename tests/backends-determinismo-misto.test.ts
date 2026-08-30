import { describe, it, expect } from "vitest";
import { inspectDependencies } from "../src/doctor";
import { fonteFake } from "./backends-fixtures";

const envCompleto = {
  resolveNpm: () => "1.0.0",
  resolveLocalPython: () => "1.0.0",
  resolveOnPath: () => "1.0.0",
};

describe("AC-088 — detecção injetada é determinística num cenário misto completo", () => {
  // SPECSFY: US-031 US-032 FR-032 FR-033 NFR-031 NFR-032 AC-088
  it("a mesma fonte injetada produz o mesmo resultado em duas execuções", () => {
    const cenario = () => fonteFake({ pi: "0.84.3", dsh: "0.1.1-rc.1" }).env;
    const primeira = inspectDependencies(envCompleto, undefined, cenario());
    const segunda = inspectDependencies(envCompleto, undefined, cenario());

    const agentesA = primeira.results.filter((d) => d.layer === "agent");
    const agentesB = segunda.results.filter((d) => d.layer === "agent");
    expect(agentesA).toEqual(agentesB);
    expect(primeira.exitCode).toBe(0);
    expect(segunda.exitCode).toBe(0);

    const codex = agentesA.find((d) => d.name === "codex");
    expect(codex?.present).toBe(false);
  });
});
