import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projeto, decisaoQueLancaSeChamada } from "./aprovacao-fixtures";

describe("AC-074 — sem evidência de uso do alvo, nada é decidido", () => {
  const semAlvo = () => mkdtempSync(join(tmpdir(), "crs-ap-sem-alvo-"));

  // SPECSFY: US-062 FR-060 AC-074
  it("uma fonte que lançaria se chamada não é acionada", () => {
    const raiz = semAlvo();
    expect(() => runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, approval: { source: decisaoQueLancaSeChamada() } })).not.toThrow();
  });

  // SPECSFY: US-062 NFR-061 AC-074
  it("o relato informa o alvo ignorado", () => {
    const raiz = semAlvo();
    const r = runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, approval: { source: decisaoQueLancaSeChamada() } });
    expect(r.report).toMatch(/ignorad/i);
  });

  // SPECSFY: US-062 FR-060 AC-074
  it("controle: a mesma fonte é de fato consultada com alvo presente, provando que o mecanismo existe", () => {
    const comAlvo = projeto();
    const r = runSetup({ env: detectEnvironment(comAlvo), root: comAlvo, write: true, approval: { source: decisaoQueLancaSeChamada() } });
    expect(r.exitCode).not.toBe(0);
  });

  // SPECSFY: US-062 FR-060 AC-074
  it("o exit code é zero", () => {
    const raiz = semAlvo();
    const r = runSetup({ env: detectEnvironment(raiz), root: raiz, write: true, approval: { source: decisaoQueLancaSeChamada() } });
    expect(r.exitCode).toBe(0);
  });
});
