import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const manifest = () => JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
const target = () => {
  const bin = manifest().bin;
  return typeof bin === "string" ? bin : bin?.["common-rules"];
};

describe("AC-008 — o pacote não exige instalação global", () => {
  // SPECSFY: US-001 US-002 FR-001 AC-008
  it("resolve o binário por caminho relativo ao projeto", () => {
    expect(target()).toBeDefined();
    expect(existsSync(resolve(ROOT, String(target())))).toBe(true);
  });

  // SPECSFY: US-001 FR-002 FR-005 NFR-003 AC-008
  it("responde ao ser executado pelo caminho local, sem instalação global", () => {
    const out = execFileSync("node", [resolve(ROOT, String(target())), "--version"], {
      encoding: "utf8",
    });
    expect(out.trim().length).toBeGreaterThan(0);
  });

  // SPECSFY: US-002 NFR-003 AC-008
  it("resolve os subsistemas npm de node_modules, e não do PATH global", () => {
    for (const dep of ["@promovaweb/specsfy", "context-mode"]) {
      expect(existsSync(resolve(ROOT, "node_modules", dep))).toBe(true);
    }
  });
});
