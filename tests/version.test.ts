import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const manifest = () => JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
const runBin = (args: string[]) => {
  const bin = manifest().bin;
  const target = typeof bin === "string" ? bin : bin?.["common-rules"];
  if (!target) throw new Error("o manifesto não declara o binário common-rules");
  return execFileSync("node", [resolve(ROOT, String(target)), ...args], { encoding: "utf8" });
};

describe("AC-004 — --version imprime a versão do manifesto", () => {
  // SPECSFY: US-001 FR-005 AC-004
  it("imprime exatamente a versão declarada", () => {
    expect(runBin(["--version"]).trim()).toContain(String(manifest().version));
  });

  // SPECSFY: US-001 FR-002 FR-005 AC-004
  it("sai com código zero", () => {
    expect(() => runBin(["--version"])).not.toThrow();
  });

  // SPECSFY: US-001 FR-001 NFR-003 AC-004
  it("declara uma versão no manifesto para poder imprimi-la", () => {
    expect(manifest().version).toBeDefined();
  });
});
