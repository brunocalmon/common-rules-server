import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const BUDGET_SECONDS = 300;

// Os tempos vivem dentro de .git, fora da árvore versionada, pelo mesmo motivo
// que o estado de execução da Phase 0: um registro de execução não é fonte.
const timingsPath = () => {
  const gitDir = execFileSync("git", ["rev-parse", "--absolute-git-dir"], {
    encoding: "utf8",
  }).trim();
  return resolve(gitDir, "phase1a-timings.json");
};
const timings = (): Record<string, number> =>
  existsSync(timingsPath()) ? JSON.parse(readFileSync(timingsPath(), "utf8")) : {};

describe("AC-009 — instalação, build e testes cabem no orçamento", () => {
  for (const etapa of ["install", "build", "test"]) {
    // SPECSFY: US-001 FR-002 FR-003 NFR-001 AC-009
    it(`registra o tempo da etapa ${etapa}`, () => {
      expect(timings()[etapa]).toBeTypeOf("number");
    });
  }

  // SPECSFY: US-001 NFR-001 AC-009
  it("soma as três etapas abaixo de cinco minutos", () => {
    const t = timings();
    const total = (t.install ?? 0) + (t.build ?? 0) + (t.test ?? 0);
    expect(Object.keys(t)).toHaveLength(3);
    expect(total).toBeLessThanOrEqual(BUDGET_SECONDS);
  });
});
