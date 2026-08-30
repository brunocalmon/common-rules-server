import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projeto } from "./aprovacao-fixtures";

describe("AC-115 — recusar não grava nada nem executa nada", () => {
  // SPECSFY: US-071 FR-071 FR-073 AC-115
  it("comando recusado continua pendente na execução seguinte, nunca fica silenciosamente aprovado", () => {
    const raiz = projeto();
    const executorQueLanca = (): never => {
      throw new Error("não deveria executar");
    };

    const primeira = runSetup({
      env: detectEnvironment(raiz),
      root: raiz,
      write: true,
      skills: { execute: executorQueLanca },
      approval: { source: { ask: () => false } },
    });
    expect(primeira.exitCode).not.toBe(0);

    let comandosVistos: { bin: string; args: string[] }[] = [];
    runSetup({
      env: detectEnvironment(raiz),
      root: raiz,
      write: true,
      skills: { execute: executorQueLanca },
      approval: {
        source: {
          ask: (_hooks: unknown, commands: { bin: string; args: string[] }[]) => {
            comandosVistos = commands ?? [];
            return false;
          },
        },
      },
    });

    expect(comandosVistos.length).toBeGreaterThan(0);
  });
});
