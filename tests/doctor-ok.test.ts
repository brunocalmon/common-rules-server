import { describe, it, expect } from "vitest";
import { inspectDependencies } from "../src/doctor";
import { semBackends } from "./backends-fixtures";

// Ambiente injetado: o resultado precisa depender do que se passa, não da máquina.
const completo = {
  resolveNpm: (name: string) =>
    ({ "@promovaweb/specsfy": "0.10.2", "context-mode": "1.0.169" })[name] ?? null,
  resolveLocalPython: () => "2.3.7",
  resolveOnPath: () => "2.3.7",
};

describe("AC-005 — doctor aprova um ambiente completo", () => {
  // SPECSFY: US-002 FR-006 AC-005
  it("lista as três dependências do projeto", () => {
    const dependencias = inspectDependencies(completo, undefined, semBackends).results.filter((r) => r.layer !== "agent");
    expect(dependencias).toHaveLength(3);
  });

  // SPECSFY: US-002 FR-006 NFR-002 AC-005
  it("reporta camada, origem resolvida e versão de cada uma", () => {
    const dependencias = inspectDependencies(completo, undefined, semBackends).results.filter((r) => r.layer !== "agent");
    for (const r of dependencias) {
      expect(r.layer).toBeDefined();
      expect(r.origin).toMatch(/^(local|global)$/);
      expect(r.version).toBeTruthy();
    }
  });

  // SPECSFY: US-002 FR-006 NFR-003 AC-005
  it("prefere a origem local quando ela existe", () => {
    const crg = inspectDependencies(completo, undefined, semBackends).results.find((r) => r.name === "code-review-graph");
    expect(crg?.origin).toBe("local");
  });

  // SPECSFY: US-002 FR-006 AC-005
  it("aprova o ambiente, com código de saída zero", () => {
    expect(inspectDependencies(completo, undefined, semBackends).exitCode).toBe(0);
  });
});
