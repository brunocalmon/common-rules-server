import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const manifest = () => JSON.parse(readFileSync(resolve(__dirname, "../package.json"), "utf8"));

describe("AC-003 — a suíte executa pelo script exigido", () => {
  // SPECSFY: US-001 FR-003 AC-003
  it("expõe test:tdd, como o enforcement do framework exige em projeto Node", () => {
    expect(manifest().scripts?.["test:tdd"]).toBeDefined();
  });

  // SPECSFY: US-001 FR-003 AC-003
  it("faz test:tdd invocar o Vitest", () => {
    expect(manifest().scripts["test:tdd"]).toMatch(/\bvitest\b/);
  });

  // SPECSFY: US-001 FR-003 NFR-001 AC-003
  it("expõe também o script de build, do qual a suíte depende", () => {
    expect(manifest().scripts?.build).toBeDefined();
  });
});
