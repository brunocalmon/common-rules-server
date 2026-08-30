import { describe, it, expect } from "vitest";
import { inspectDependencies } from "../src/doctor";
import { renderReport } from "../src/cli";
import { fonteFake } from "./backends-fixtures";

const envCompleto = {
  resolveNpm: () => "1.0.0",
  resolveLocalPython: () => "1.0.0",
  resolveOnPath: () => "1.0.0",
};

describe("AC-089 — a camada agent aparece no texto do relato", () => {
  // SPECSFY: FR-031 NFR-030 NFR-031 AC-089
  it("o texto nomeia a camada agent, distinta de npm e python, sem afetar o código de saída", () => {
    const { env: backendEnv } = fonteFake({ pi: "0.84.3" });
    const report = inspectDependencies(envCompleto, undefined, backendEnv);
    const texto = renderReport(report);

    expect(texto).toMatch(/camada agent/);
    expect(texto).toMatch(/camada npm/);
    expect(texto).toMatch(/camada python/);
    expect(report.exitCode).toBe(0);
  });

  // SPECSFY: FR-031 NFR-030 NFR-031 AC-089
  it("um backend presente e não suportado aparece marcado como tal no texto", () => {
    const { env: backendEnv } = fonteFake({ dsh: "0.1.1-rc.1" });
    const report = inspectDependencies(envCompleto, undefined, backendEnv);
    const texto = renderReport(report);
    expect(texto).toMatch(/dsh.*não suportado/);
  });
});
