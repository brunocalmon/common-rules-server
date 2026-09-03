import { describe, it, expect } from "vitest";
import { inspectDependencies } from "../src/doctor";
import { readTrace } from "../src/telemetry/read";
import { projeto } from "./trace-fixtures";
import { semBackends } from "./backends-fixtures";

const ambiente = { resolveNpm: () => "1.0.0", resolveLocalPython: () => "2.3.7", resolveOnPath: () => null };
const semExtensoes = () => [];

describe("AC-053 — o doctor não fabrica identificador", () => {
  // SPECSFY: US-040 FR-044 AC-053
  it("sem registro, a leitura reporta ausência", () => {
    expect(readTrace(projeto()).kind).toBe("absent");
  });

  // SPECSFY: US-040 FR-045 AC-053
  it("o relato não nomeia identificador algum", () => {
    const t = inspectDependencies(ambiente, projeto(), semBackends, semExtensoes).trace;
    expect(t?.kind).toBe("absent");
    expect(t && "trace" in t).toBe(false);
  });

  // SPECSFY: US-040 FR-044 FR-045 AC-053
  it("o diagnóstico das dependências continua ocorrendo", () => {
    expect(inspectDependencies(ambiente, projeto(), semBackends, semExtensoes).results.length).toBeGreaterThan(0);
  });
});
