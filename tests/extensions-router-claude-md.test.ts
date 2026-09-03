import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projeto, decisaoFixa } from "./aprovacao-fixtures";

describe("AC-136 — CLAUDE.md ganha a seção própria do common-rules no primeiro setup", () => {
  // SPECSFY: US-082 FR-086 FR-087 NFR-083 AC-136
  it("setup roda pela primeira vez e CLAUDE.md ganha o bloco ancorado do roteador", () => {
    const raiz = projeto();
    runSetup({
      env: detectEnvironment(raiz),
      root: raiz,
      write: true,
      approval: { source: decisaoFixa(true) },
    });

    const caminho = join(raiz, "CLAUDE.md");
    expect(existsSync(caminho)).toBe(true);
    const conteudo = readFileSync(caminho, "utf8");
    expect(conteudo).toContain("<!-- common-rules:extension:router:start -->");
    expect(conteudo).toContain("<!-- common-rules:extension:router:end -->");

    const registro = JSON.parse(readFileSync(join(raiz, ".common-rules", "extensions.json"), "utf8"));
    expect(registro.artifacts.some((a: { target: string }) => a.target === "CLAUDE.md")).toBe(true);
  });
});
