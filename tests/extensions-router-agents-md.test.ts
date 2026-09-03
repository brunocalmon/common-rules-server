import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projeto, decisaoFixa } from "./aprovacao-fixtures";

describe("AC-137 — AGENTS.md ganha um ponteiro mínimo, sem duplicar CLAUDE.md", () => {
  // SPECSFY: US-082 FR-086 FR-087 NFR-083 AC-137
  it("setup roda e AGENTS.md ganha o ponteiro, sem repetir o texto do roteador", () => {
    const raiz = projeto();
    runSetup({
      env: detectEnvironment(raiz),
      root: raiz,
      write: true,
      approval: { source: decisaoFixa(true) },
    });

    const caminhoAgents = join(raiz, "AGENTS.md");
    expect(existsSync(caminhoAgents)).toBe(true);
    const conteudoAgents = readFileSync(caminhoAgents, "utf8");
    expect(conteudoAgents).toContain("<!-- common-rules:extension:agents-pointer:start -->");
    expect(conteudoAgents.toLowerCase()).toContain("claude.md");

    const conteudoClaude = readFileSync(join(raiz, "CLAUDE.md"), "utf8");
    const linhasRoteador = conteudoClaude.split("\n").filter((l) => l.trim().length > 0);
    for (const linha of linhasRoteador) {
      expect(conteudoAgents.includes(linha) && linha.length > 40).toBe(false);
    }
  });
});
