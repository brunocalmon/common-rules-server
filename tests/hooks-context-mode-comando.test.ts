import { describe, it, expect } from "vitest";
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { readHook } from "../src/hooks/source";
import { translateForClaudeCode } from "../src/hooks/claude-code";

const HOOKS_CONTEXT_MODE = [
  "context-mode-pretooluse.md",
  "context-mode-posttooluse.md",
  "context-mode-stop.md",
];

describe("AC-009 — o comando final não contém placeholder não resolvido", () => {
  // SPECSFY: US-002 FR-002 AC-009
  it("nenhum fragmento contém a chave {ide}", () => {
    for (const nome of HOOKS_CONTEXT_MODE) {
      const hook = readHook(readFileSync(join("resources", "hooks", nome), "utf8"));
      expect(hook.script).not.toContain("{ide}");
    }
  });

  // SPECSFY: US-002 FR-002 AC-009
  it("o comando começa com context-mode hook claude-code", () => {
    for (const nome of HOOKS_CONTEXT_MODE) {
      const hook = readHook(readFileSync(join("resources", "hooks", nome), "utf8"));
      expect(hook.script.trim()).toMatch(/^context-mode hook claude-code /);
    }
  });

  // SPECSFY: US-002 FR-002 AC-009
  // Timeout generoso: o `context-mode` real, chamado de verdade e não
  // mocado, pode legitimamente levar mais que os 5s padrão do Vitest quando
  // `npm run verify` roda install, build e suíte juntos — foi exatamente
  // isso que produziu um falso vermelho na primeira execução deste caso.
  it("o script traduzido executa de verdade e não lança por sintaxe", () => {
    const hook = readHook(readFileSync(join("resources", "hooks", "context-mode-pretooluse.md"), "utf8"));
    const traduzido = translateForClaudeCode(hook);
    const dir = mkdtempSync(join(tmpdir(), "crs-cm-"));
    const caminho = join(dir, "hook.sh");
    writeFileSync(caminho, traduzido.script, { mode: 0o755 });
    const r = spawnSync("bash", [caminho], {
      input: '{"tool_input":{"command":"echo x"}}',
      encoding: "utf8",
      timeout: 25_000,
    });
    expect(r.error).toBeUndefined();
    expect(r.status).not.toBeNull();
  }, 30_000);
});
