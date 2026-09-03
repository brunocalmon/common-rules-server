import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const caminho = resolve(__dirname, "..", "skills", "common-rules-extension-creator", "SKILL.md");

describe("AC-138 — skill de fachada nunca escreve arquivo diretamente", () => {
  // SPECSFY: US-080 US-082 FR-080 FR-086 FR-087 NFR-083 AC-138
  it("a skill entrevista a pessoa e só emite o comando da CLI, sem lógica de escrita", () => {
    expect(existsSync(caminho)).toBe(true);
    const conteudo = readFileSync(caminho, "utf8");

    expect(conteudo).toMatch(/common-rules extension create/);
    expect(conteudo).not.toMatch(/writeFileSync|fs\.write|JSON\.stringify/);
  });
});
