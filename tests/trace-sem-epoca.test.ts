import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projeto, EPOCA } from "./trace-fixtures";

function entradas(): { installedAt: string }[] {
  const raiz = projeto();
  runSetup({ env: detectEnvironment(raiz), root: raiz, write: true });
  return JSON.parse(readFileSync(join(raiz, ".common-rules", "install.json"), "utf8"))["hooks"];
}

describe("AC-052 — a época deixa de ser o valor gravado", () => {
  // SPECSFY: US-041 FR-042 AC-052
  it("nenhuma entrada traz o instante da época", () => {
    for (const h of entradas()) expect(h.installedAt).not.toBe(EPOCA);
  });

  // SPECSFY: US-041 NFR-042 AC-052
  it("nenhuma entrada traz um instante anterior ao ano 2000", () => {
    for (const h of entradas()) expect(Date.parse(h.installedAt)).toBeGreaterThan(Date.parse("2000-01-01T00:00:00.000Z"));
  });

  // SPECSFY: US-041 FR-042 AC-052
  it("o instante é texto em forma ISO", () => {
    for (const h of entradas()) expect(h.installedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
