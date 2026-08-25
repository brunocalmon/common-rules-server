import { describe, it, expect } from "vitest";
import { existsSync, statSync } from "node:fs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const manifest = () => JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
const binTarget = () => {
  const bin = manifest().bin;
  return typeof bin === "string" ? bin : bin?.["common-rules"];
};

describe("AC-002 — build produz um executável", () => {
  // SPECSFY: US-001 FR-001 AC-002
  it("declara o binário common-rules no manifesto", () => {
    expect(binTarget()).toBeDefined();
  });

  // SPECSFY: US-001 FR-002 AC-002
  it("gera em dist/ o arquivo que o campo de binário declara", () => {
    const target = binTarget();
    expect(target).toBeDefined();
    expect(existsSync(resolve(ROOT, String(target)))).toBe(true);
  });

  // SPECSFY: US-001 FR-002 NFR-001 AC-002
  it("aponta o binário para dentro de dist/, e não para o código-fonte", () => {
    expect(String(binTarget())).toMatch(/^\.?\/?dist\//);
  });

  // SPECSFY: US-001 FR-002 AC-002
  it("produz um arquivo não vazio", () => {
    const target = binTarget();
    expect(target).toBeDefined();
    expect(statSync(resolve(ROOT, String(target))).size).toBeGreaterThan(0);
  });
});
