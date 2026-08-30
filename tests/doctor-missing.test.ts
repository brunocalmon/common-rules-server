import { describe, it, expect } from "vitest";
import { inspectDependencies } from "../src/doctor";
import { semBackends } from "./backends-fixtures";

// code-review-graph ausente das duas origens; as npm resolvem normalmente.
const semCrg = {
  resolveNpm: (name: string) =>
    ({ "@promovaweb/specsfy": "0.10.2", "context-mode": "1.0.169" })[name] ?? null,
  resolveLocalPython: () => null,
  resolveOnPath: () => null,
};

const crg = () => inspectDependencies(semCrg, undefined, semBackends).results.find((r) => r.name === "code-review-graph");

describe("AC-006 — doctor reprova nomeando a ausente", () => {
  // SPECSFY: US-002 FR-006 AC-006
  it("nomeia code-review-graph como ausente", () => {
    expect(crg()?.present).toBe(false);
  });

  // SPECSFY: US-002 FR-006 AC-006
  it("explica que a ferramenta vem de uv, e não do npm", () => {
    expect(String(crg()?.hint)).toMatch(/uv/i);
  });

  // SPECSFY: US-002 FR-004 AC-006
  it("mantém as dependências npm aprovadas, isolando a falha", () => {
    const npm = inspectDependencies(semCrg, undefined, semBackends).results.filter((r) => r.layer === "npm");
    expect(npm.every((r) => r.present)).toBe(true);
  });

  // SPECSFY: US-002 FR-006 AC-006
  it("reprova o conjunto, com código de saída diferente de zero", () => {
    expect(inspectDependencies(semCrg, undefined, semBackends).exitCode).not.toBe(0);
  });
});
