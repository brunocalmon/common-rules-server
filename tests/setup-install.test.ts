import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";

const env = { hasClaudeCode: true, files: [".claude/settings.json"] };
const executar = () => runSetup({ env, write: true, dryRun: false });

describe("AC-001 — os quatro hooks de integração ficam instalados", () => {
  // SPECSFY: US-001 FR-002 FR-005 AC-001
  it("escreve as quatro entradas de integração de subsistema", () => {
    const nomes = executar().installed.map((h) => h.name);
    for (const n of ["context-mode-pretooluse", "context-mode-posttooluse", "context-mode-stop", "code-review-graph-update"]) {
      expect(nomes).toContain(n);
    }
  });

  // SPECSFY: US-001 FR-002 AC-001
  it("coloca cada uma sob o evento que o hook declara", () => {
    for (const h of executar().installed) expect(h.event).toMatch(/^(PreToolUse|PostToolUse|Stop)$/);
  });

  // SPECSFY: US-001 FR-004 AC-001
  it("cria o registro de instalação dentro do projeto", () => {
    expect(executar().recordPath).toMatch(/^\.common-rules\//);
  });

  // SPECSFY: US-001 FR-001 NFR-001 AC-001
  it("não escreve nada fora do projeto", () => {
    for (const p of executar().written) expect(p.startsWith("/")).toBe(false);
  });
});
