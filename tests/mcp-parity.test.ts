import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { executeSetup } from "../src/mcp/tool";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projetoDescartavel } from "./mcp-fixtures";

/**
 * Reproduz o que a linha de comando faz, para comparar contra o protocolo.
 * `runSetup` já grava os dois arquivos quando `write` é verdadeiro; escrever
 * de novo aqui duplicaria a operação que se quer comparar.
 */
function pelaLinhaDeComando(raiz: string) {
  return runSetup({ env: detectEnvironment(raiz), root: raiz, write: true });
}

describe("AC-006 — os dois pontos de entrada descrevem o mesmo resultado", () => {
  // SPECSFY: US-003 FR-004 AC-006
  it("os hooks instalados coincidem em nome", async () => {
    const viaTerminal = pelaLinhaDeComando(projetoDescartavel("crs-cli-"));
    const viaTool = await executeSetup({ project_root: projetoDescartavel("crs-mcp-") });
    expect(viaTool.structuredContent?.hooks.map((h) => h.name).sort())
      .toEqual(viaTerminal.installed.map((h) => h.name).sort());
  });

  // SPECSFY: US-003 FR-005 AC-006
  it("os hooks coincidem em evento", async () => {
    const viaTerminal = pelaLinhaDeComando(projetoDescartavel("crs-cli-"));
    const viaTool = await executeSetup({ project_root: projetoDescartavel("crs-mcp-") });
    const chave = (h: { name: string; event: string }) => `${h.name}:${h.event}`;
    expect(viaTool.structuredContent?.hooks.map(chave).sort())
      .toEqual(viaTerminal.installed.map(chave).sort());
  });

  // SPECSFY: US-003 NFR-002 AC-006
  it("os registros coincidem em alvo e quantidade de entradas", async () => {
    const raizCli = projetoDescartavel("crs-cli-");
    const raizMcp = projetoDescartavel("crs-mcp-");
    pelaLinhaDeComando(raizCli);
    await executeSetup({ project_root: raizMcp });
    const ler = (r: string) => JSON.parse(readFileSync(join(r, ".common-rules", "install.json"), "utf8"));
    const a = ler(raizCli), b = ler(raizMcp);
    expect(b.target).toBe(a.target);
    expect(b.hooks).toHaveLength(a.hooks.length);
  });
});
