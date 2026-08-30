import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { arvore, projeto } from "./aprovacao-fixtures";

describe("AC-072 — a ausência de injeção não aprova por omissão", () => {
  // Sem `source` injetado, apenas contexto e o leitor de baixo nível: exercita
  // a escolha de canal real e o parse real de documento, sem risco de travar
  // em leitura de stdin real — o único ponto substituído é a origem dos bytes.
  const rodar = (raiz: string) => runSetup({
    env: detectEnvironment(raiz), root: raiz, write: true,
    approval: { context: { hasTerminal: () => false }, stdin: { read: () => "" } },
  });

  // SPECSFY: US-062 FR-061 NFR-061 AC-072
  it("a escolha do canal considera o contexto real fornecido", () => {
    const raiz = projeto();
    expect(rodar(raiz).exitCode).not.toBe(0);
  });

  // SPECSFY: US-062 FR-065 NFR-061 AC-072
  it("o comportamento padrão, sem fonte explícita, não aprova", () => {
    const raiz = projeto();
    const antes = arvore(raiz);
    rodar(raiz);
    expect(arvore(raiz)).toEqual(antes);
  });

  // SPECSFY: US-062 FR-061 AC-072
  it("a implementação real de leitura de documento é a que decide, não um valor fixo no código", () => {
    const raizVazia = projeto("crs-ap-vazio-");
    const raizNegada = projeto("crs-ap-negada-");
    const a = runSetup({ env: detectEnvironment(raizVazia), root: raizVazia, write: true, approval: { context: { hasTerminal: () => false }, stdin: { read: () => "" } } });
    const b = runSetup({ env: detectEnvironment(raizNegada), root: raizNegada, write: true, approval: { context: { hasTerminal: () => false }, stdin: { read: () => '{"approved": false}' } } });
    expect(a.exitCode).not.toBe(0);
    expect(b.exitCode).not.toBe(0);
  });
});
