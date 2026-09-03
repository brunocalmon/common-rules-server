import { describe, it, expect } from "vitest";
import { renderReport } from "../src/cli";
import type { Report } from "../src/doctor";

const reportBase: Report = {
  results: [{ name: "@promovaweb/specsfy", layer: "npm", present: true, origin: "local", version: "1.0.0" }],
  exitCode: 1,
};

describe("AC-133 — o texto do doctor nomeia o artefato de extensão divergente", () => {
  // SPECSFY: US-081 FR-083 FR-085 NFR-080 NFR-082 AC-133
  it("nomeia cada artefato divergente no texto renderizado", () => {
    const report: Report = {
      ...reportBase,
      divergentExtensions: [{ name: "minha-extensao", target: "meu-hook", reason: "checksum-mismatch" }],
    };
    const texto = renderReport(report);
    expect(texto).toMatch(/minha-extensao/);
    expect(texto).toMatch(/checksum-mismatch/);
  });

  // SPECSFY: US-081 FR-083 FR-085 NFR-080 NFR-082 AC-133
  it("sem divergência, nenhuma linha extra aparece", () => {
    const texto = renderReport(reportBase);
    expect(texto).not.toMatch(/divergente/);
  });
});
