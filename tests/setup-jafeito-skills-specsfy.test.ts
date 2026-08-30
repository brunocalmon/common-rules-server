import { describe, it, expect } from "vitest";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projetoComSkills, executorDualOrigem } from "./skills-fixtures";
import { decisaoQueLancaSeChamada } from "./aprovacao-fixtures";
import type { Executor as SpecsfyExecutor } from "../src/specsfy/install";

function executorSpecsfyFake(raiz: string) {
  let chamadas = 0;
  const fn: SpecsfyExecutor = (root) => {
    chamadas += 1;
    mkdirSync(join(root, ".specsfy"), { recursive: true });
    return { status: 0, changed: 1, paths: [join(root, ".specsfy")] };
  };
  return { fn, contador: () => chamadas };
}

function executorSpecsfyQueLancaSeChamado(): SpecsfyExecutor {
  return () => {
    throw new Error("não deveria ser chamado: nada mudou desde o registro anterior");
  };
}

describe("AC-079 — nada ausente preserva o curto-circuito original", () => {
  const configurado = () => {
    const raiz = projetoComSkills();
    const env = detectEnvironment(raiz);
    const skillsEx = executorDualOrigem();
    const specsfyEx = executorSpecsfyFake(raiz);
    const primeira = runSetup({
      env, root: raiz, write: true,
      skills: { execute: skillsEx.fn },
      specsfy: { execute: specsfyEx.fn },
    });
    return { raiz, env, previous: primeira.record, specsfyChamadasNaPrimeira: specsfyEx.contador() };
  };

  // SPECSFY: US-020 US-023 FR-030 AC-079
  it("controle: a primeira execução de fato chama os executores, provando que o mecanismo existe", () => {
    const { specsfyChamadasNaPrimeira } = configurado();
    expect(specsfyChamadasNaPrimeira).toBeGreaterThan(0);
  });

  // SPECSFY: US-020 US-023 FR-030 AC-079
  it("hooks, skills e framework intactos: nenhum executor é invocado na segunda execução", () => {
    const { raiz, env, previous } = configurado();
    expect(() => runSetup({
      env, root: raiz, write: true, previous,
      skills: { execute: () => { throw new Error("não deveria ser chamado: skills intactas"); } },
      specsfy: { execute: executorSpecsfyQueLancaSeChamado() },
      approval: { source: decisaoQueLancaSeChamada() },
    })).not.toThrow();
  });

  // SPECSFY: US-020 US-023 FR-030 AC-079
  it("o relato informa que já estava configurado", () => {
    const { raiz, env, previous } = configurado();
    const segunda = runSetup({
      env, root: raiz, write: true, previous,
      skills: { execute: () => { throw new Error("não deveria ser chamado: skills intactas"); } },
      specsfy: { execute: executorSpecsfyQueLancaSeChamado() },
      approval: { source: decisaoQueLancaSeChamada() },
    });
    expect(segunda.report).toMatch(/já estava configurado/i);
    expect(segunda.exitCode).toBe(0);
  });
});
