import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projeto } from "./aprovacao-fixtures";

describe("AC-065 — o documento autoriza a execução", () => {
  const rodar = (raiz: string) => runSetup({
    env: detectEnvironment(raiz), root: raiz, write: true,
    approval: { context: { hasTerminal: () => false }, stdin: { read: () => '{"approved": true}' } },
  });

  // SPECSFY: US-061 FR-062 AC-065
  it("o documento é de fato lido antes de decidir", () => {
    const raiz = projeto();
    let lido = 0;
    runSetup({
      env: detectEnvironment(raiz), root: raiz, write: true,
      approval: { context: { hasTerminal: () => false }, stdin: { read: () => { lido += 1; return '{"approved": true}'; } } },
    });
    expect(lido).toBe(1);
  });

  // SPECSFY: US-061 FR-062 AC-065
  it("a execução ocorre", () => {
    const raiz = projeto();
    expect(rodar(raiz).exitCode).toBe(0);
  });

  // SPECSFY: US-061 FR-062 AC-065
  it("os arquivos previstos existem", () => {
    const raiz = projeto();
    rodar(raiz);
    expect(existsSync(join(raiz, ".claude", "settings.json"))).toBe(true);
    expect(existsSync(join(raiz, ".common-rules", "install.json"))).toBe(true);
  });

  // SPECSFY: US-061 FR-062 AC-065
  it("o número de hooks instalados é o esperado", () => {
    const raiz = projeto();
    expect(rodar(raiz).installed.length).toBe(7);
  });
});
