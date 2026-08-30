import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projeto, decisaoFixa, decisaoQueLancaSeChamada } from "./aprovacao-fixtures";

describe("AC-073 — projeto já configurado não pede aprovação", () => {
  const jaConfigurado = () => {
    const raiz = projeto();
    runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, approval: { source: decisaoFixa(true) } });
    const registro = JSON.parse(readFileSync(join(raiz, ".common-rules", "install.json"), "utf8"));
    return { raiz, registro };
  };

  // SPECSFY: US-062 FR-060 AC-073
  it("uma fonte que lançaria se chamada não é acionada na reexecução", () => {
    const { raiz, registro } = jaConfigurado();
    expect(() => runSetup({
      env: detectEnvironment(raiz), root: raiz, write: true,
      previous: registro, approval: { source: decisaoQueLancaSeChamada() },
    })).not.toThrow();
  });

  // SPECSFY: US-062 FR-063 AC-073
  it("o relato informa que já estava configurado", () => {
    const { raiz, registro } = jaConfigurado();
    const r = runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, previous: registro, approval: { source: decisaoQueLancaSeChamada() } });
    expect(r.report).toMatch(/já estava configurado/i);
  });

  // SPECSFY: US-062 FR-060 AC-073
  it("controle: a mesma fonte é de fato consultada numa primeira execução, provando que o mecanismo existe", () => {
    const raiz = projeto();
    const r = runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, approval: { source: decisaoQueLancaSeChamada() } });
    expect(r.exitCode).not.toBe(0);
  });

  // SPECSFY: US-062 FR-060 AC-073
  it("o exit code segue de sucesso", () => {
    const { raiz, registro } = jaConfigurado();
    const r = runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, previous: registro, approval: { source: decisaoQueLancaSeChamada() } });
    expect(r.exitCode).toBe(0);
  });
});
