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
