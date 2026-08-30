import { describe, it, expect } from "vitest";
import { inspectDependencies } from "../src/doctor";
import { fonteFake } from "./backends-fixtures";

const envCompleto = {
  resolveNpm: () => "1.0.0",
  resolveLocalPython: () => "1.0.0",
  resolveOnPath: () => "1.0.0",
};

describe("AC-081 — backend suportado ausente não afeta o código de saída", () => {
  // SPECSFY: US-030 FR-030 PR-032 NFR-031 AC-081
  it("nenhum backend de agente presente ainda sai com código zero, quando npm/python estão completos", () => {
    const { env: backendEnv } = fonteFake({});
    const r = inspectDependencies(envCompleto, undefined, backendEnv);
    expect(r.exitCode).toBe(0);
  });

  // SPECSFY: US-030 FR-030 PR-032 NFR-031 AC-081
  it("os cinco suportados aparecem nomeados como ausentes", () => {
    const { env: backendEnv } = fonteFake({});
    const r = inspectDependencies(envCompleto, undefined, backendEnv);
    const agentes = r.results.filter((d) => d.layer === "agent");
    expect(agentes.length).toBeGreaterThan(0);
    expect(agentes.every((d) => !d.present)).toBe(true);
  });
});
