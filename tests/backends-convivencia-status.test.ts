import { describe, it, expect } from "vitest";
import { inspectDependencies } from "../src/doctor";
import { fonteFake } from "./backends-fixtures";

const envCompleto = {
  resolveNpm: () => "1.0.0",
  resolveLocalPython: () => "1.0.0",
  resolveOnPath: () => "1.0.0",
};

describe("AC-086 — suportado, não suportado e ausente convivem no mesmo relato", () => {
  // SPECSFY: US-031 FR-031 FR-033 NFR-031 AC-086
  it("pi presente e suportado, dsh presente e não suportado, agy ausente", () => {
    const { env: backendEnv } = fonteFake({ pi: "0.84.3", dsh: "0.1.1-rc.1" });
    const r = inspectDependencies(envCompleto, undefined, backendEnv);
    const agentes = r.results.filter((d) => d.layer === "agent");
    const pi = agentes.find((d) => d.name === "pi");
    const dsh = agentes.find((d) => d.name === "dsh");
    const agy = agentes.find((d) => d.name === "agy");
    expect(pi?.present).toBe(true);
    expect(pi?.supported).toBe(true);
    expect(dsh?.present).toBe(true);
    expect(dsh?.supported).toBe(false);
    expect(agy?.present).toBe(false);
    expect(r.exitCode).toBe(0);
  });
});
