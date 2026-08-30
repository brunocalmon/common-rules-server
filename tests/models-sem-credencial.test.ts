import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backendsFake, modeloFake, capacidadeFake, ollamaPresente } from "./models-fixtures";

const VARIAVEIS_DE_CREDENCIAL = [
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "GOOGLE_API_KEY",
  "OLLAMA_API_KEY",
  "CLAUDE_API_KEY",
];

describe("AC-102 — nenhuma variável de ambiente de credencial é lida durante o cálculo", () => {
  // SPECSFY: FR-037 NFR-033 NFR-034 NFR-035 AC-102
  it("o resultado não muda em função da ausência dessas variáveis, sem lançar exceção", () => {
    const originais = VARIAVEIS_DE_CREDENCIAL.map((nome) => [nome, process.env[nome]] as const);
    try {
      for (const nome of VARIAVEIS_DE_CREDENCIAL) process.env[nome] = "valor-fake-presente";
      const modelos = [modeloFake("qwen2.5:3b", 2)];
      const comCredenciais = recommend(backendsFake(["pi"]), ollamaPresente(modelos), capacidadeFake(10));

      for (const nome of VARIAVEIS_DE_CREDENCIAL) delete process.env[nome];
      let semCredenciais;
      expect(() => {
        semCredenciais = recommend(backendsFake(["pi"]), ollamaPresente(modelos), capacidadeFake(10));
      }).not.toThrow();

      expect(semCredenciais).toEqual(comCredenciais);
    } finally {
      for (const [nome, valor] of originais) {
        if (valor === undefined) delete process.env[nome];
        else process.env[nome] = valor;
      }
    }
  });
});
