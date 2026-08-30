import { describe, it, expect } from "vitest";
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { readHook } from "../src/hooks/source";
import { translateForClaudeCode } from "../src/hooks/claude-code";

const HOOKS_SEM_BLOCO = [
  "code-review-graph-update.md",
  "context-mode-pretooluse.md",
  "context-mode-posttooluse.md",
  "context-mode-stop.md",
];

/** O comando declarado em `raw_command:` no frontmatter, lido à parte do parser. */
function comandoDeclarado(nomeArquivo: string): string {
  const bruto = readFileSync(join("hooks", nomeArquivo), "utf8");
  const m = /^raw_command:\s*(.+)$/m.exec(bruto);
  if (!m || !m[1]) throw new Error(`hook ${nomeArquivo} não declara raw_command`);
  return m[1].trim();
}

describe("AC-010 — fidelidade do fragmento para hook sem bloco de código", () => {
  // SPECSFY: US-001 FR-002 AC-010
  it("o fragmento embutido no script é exatamente o raw_command declarado", () => {
    for (const nome of HOOKS_SEM_BLOCO) {
      const hook = readHook(readFileSync(join("hooks", nome), "utf8"));
      expect(hook.script.trim()).toBe(comandoDeclarado(nome));
    }
  });

  // SPECSFY: US-001 FR-002 AC-010
  it("o script traduzido contém o comando, não um fragmento vazio", () => {
    for (const nome of HOOKS_SEM_BLOCO) {
      const hook = readHook(readFileSync(join("hooks", nome), "utf8"));
      const traduzido = translateForClaudeCode(hook);
      expect(traduzido.script).toContain(comandoDeclarado(nome));
    }
  });

  // SPECSFY: US-001 FR-002 AC-010
  it("o comando de fato executa quando o script roda como subprocesso, e não apenas aparece no texto", () => {
    const hook = readHook(readFileSync(join("hooks", "code-review-graph-update.md"), "utf8"));
    const traduzido = translateForClaudeCode(hook);
    const original = comandoDeclarado("code-review-graph-update.md");
    // Confirma primeiro que o comando está de fato no script — sem isso, a
    // substituição abaixo seria um no-op silencioso e a asserção passaria à
    // toa, o mesmo defeito que esta tarefa existe para corrigir.
    expect(traduzido.script).toContain(original);
    // Substitui o comando real por um marcador observável, para provar que o
    // ponto exato onde raw_command entraria é executado pelo interpretador —
    // e não apenas presente como texto morto em comentário.
    const script = traduzido.script.replace(original, "echo MARCA_DE_EXECUCAO_REAL");
    const dir = mkdtempSync(join(tmpdir(), "crs-hook-"));
    const caminho = join(dir, "hook.sh");
    writeFileSync(caminho, script, { mode: 0o755 });
    const r = spawnSync("bash", [caminho], { input: '{"tool_input":{}}', encoding: "utf8" });
    expect(r.stdout + r.stderr).toContain("MARCA_DE_EXECUCAO_REAL");
  });
});
