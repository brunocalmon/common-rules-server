import { describe, it, expect } from "vitest";
import { translateForClaudeCode, renderSettings, extractScripts, unwrap } from "../src/hooks/claude-code";
import type { Hook } from "../src/hooks/source";

// Script deliberadamente hostil: aspas simples e duplas, barras invertidas,
// cifrões e substituição de comando. É onde a v0.2.8 falhou.
const HOSTIL = `#!/usr/bin/env bash\nif [[ "$1" == *'rm -rf'* ]]; then\n  printf '%s\\n' "bloqueado: \\$1 contém \\"rm -rf\\""\n  exit 2\nfi\nexit 0\n`;
const hook: Hook = {
  name: "probe", description: "sonda", event: "before-shell", blocking: true, script: HOSTIL,
};

describe("AC-010 — o escape sobrevive à ida e à volta", () => {
  // SPECSFY: US-002 FR-002 NFR-003 AC-010
  it("recupera o script idêntico ao original, byte a byte", () => {
    const settings = renderSettings([translateForClaudeCode(hook)]);
    expect(unwrap(extractScripts(settings)[0] ?? "")).toBe(HOSTIL);
  });

  // SPECSFY: US-002 FR-002 NFR-003 AC-010
  it("não ganha nem perde barra invertida", () => {
    const recuperado = unwrap(extractScripts(renderSettings([translateForClaudeCode(hook)]))[0] ?? "");
    const conta = (s: string) => (s.match(/\\/g) ?? []).length;
    expect(conta(recuperado)).toBe(conta(HOSTIL));
  });

  // SPECSFY: US-002 FR-006 NFR-003 AC-010
  it("mantém o guard recuperado recusando o que a fonte recusava", () => {
    const completo = extractScripts(renderSettings([translateForClaudeCode(hook)]))[0] ?? "";
    expect(completo).toContain("HOOK_COMMAND=");
    expect(unwrap(completo)).toBe(HOSTIL);
  });
});
