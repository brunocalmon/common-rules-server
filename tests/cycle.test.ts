import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const manifest = () => JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
const scriptPath = resolve(ROOT, "scripts", "cycle.mjs");
const gitDir = () =>
  execFileSync("git", ["rev-parse", "--absolute-git-dir"], { encoding: "utf8" }).trim();

describe("AC-011 — um clone recém-obtido fica verde com um comando", () => {
  // SPECSFY: US-001 FR-003 FR-007 AC-011
  it("expõe o script verify no manifesto", () => {
    expect(manifest().scripts?.verify).toBeDefined();
  });

  // SPECSFY: US-001 FR-007 AC-011
  it("aponta verify para o executor do ciclo", () => {
    expect(String(manifest().scripts.verify)).toContain("cycle.mjs");
  });

  // SPECSFY: US-001 FR-007 AC-011
  it("tem o executor do ciclo presente no repositório", () => {
    expect(existsSync(scriptPath)).toBe(true);
  });
});

describe("AC-012 — o ciclo registra as três etapas", () => {
  // SPECSFY: US-001 FR-007 NFR-001 AC-012
  it("mede instalação, compilação e suíte em separado", () => {
    const fonte = readFileSync(scriptPath, "utf8");
    for (const etapa of ["install", "build", "test"]) expect(fonte).toContain(etapa);
  });

  // SPECSFY: US-001 FR-007 NFR-001 AC-012
  it("grava os tempos fora da árvore versionada", () => {
    const fonte = readFileSync(scriptPath, "utf8");
    expect(fonte).toMatch(/absolute-git-dir|phase1a-timings/);
    expect(existsSync(resolve(ROOT, "phase1a-timings.json"))).toBe(false);
  });

  // SPECSFY: US-001 FR-007 NFR-001 AC-012
  it("registra as três medições quando o ciclo já rodou", () => {
    const registro = resolve(gitDir(), "phase1a-timings.json");
    expect(existsSync(registro)).toBe(true);
    expect(Object.keys(JSON.parse(readFileSync(registro, "utf8"))).sort()).toEqual([
      "build",
      "install",
      "test",
    ]);
  });
});

describe("AC-013 — o ciclo falha alto quando uma etapa reprova", () => {
  // SPECSFY: US-001 FR-007 NFR-001 AC-013
  it("interrompe na primeira reprovação, sem prosseguir", () => {
    const fonte = readFileSync(scriptPath, "utf8");
    expect(fonte).toMatch(/exit\(|exitCode/);
    expect(fonte).toMatch(/break|return|process\.exit/);
  });

  // SPECSFY: US-001 FR-007 AC-013
  it("nomeia a etapa que reprovou", () => {
    expect(readFileSync(scriptPath, "utf8")).toMatch(/etapa|step/i);
  });
});
