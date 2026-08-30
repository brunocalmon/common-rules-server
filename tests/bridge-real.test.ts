import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projeto, decisaoFixa } from "./aprovacao-fixtures";

const temUv = (): boolean => {
  try {
    execFileSync("which", ["uv"], { stdio: ["ignore", "ignore", "ignore"] });
    return true;
  } catch {
    return false;
  }
};

describe("AC-116 — a ponte Python executa de verdade quando aprovada", () => {
  // SPECSFY: US-072 FR-074 NFR-072 AC-116
  it("com code-review-graph ausente das duas origens e uv disponível, .venv-crg é criado de verdade", () => {
    if (!temUv()) return;
    const raiz = projeto();
    runSetup({
      env: detectEnvironment(raiz),
      root: raiz,
      write: true,
      bridgeEnv: { localVenv: null, onPath: null, hasUv: true },
      // Descartável: sem isto, a ponte real criaria .venv-crg na raiz do
      // próprio pacote common-rules (onde `doctor.ts` de fato a procura),
      // poluindo este repositório como efeito colateral de rodar a suíte.
      bridgeCwd: raiz,
      approval: { source: decisaoFixa(true) },
    });
    expect(existsSync(join(raiz, ".venv-crg"))).toBe(true);
  }, 120_000);
});
