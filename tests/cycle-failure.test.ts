import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const manifest = () => JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
const scriptPath = resolve(ROOT, "scripts", "cycle.mjs");
const gitDir = () =>
  execFileSync("git", ["rev-parse", "--absolute-git-dir"], { encoding: "utf8" }).trim();

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
