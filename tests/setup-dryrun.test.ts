import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";

const env = { hasClaudeCode: true, files: [".claude/settings.json"] };
const ensaio = () => runSetup({ env, write: true, dryRun: true });

describe("AC-007 — a execução seca não escreve", () => {
  // SPECSFY: US-003 FR-005 FR-007 AC-007
  it("lista os sete hooks que seriam instalados e seus destinos", () => {
    expect(ensaio().planned).toHaveLength(7);
    for (const h of ensaio().planned) expect(h.target).toBeTruthy();
  });

  // SPECSFY: US-003 FR-007 NFR-002 AC-007
  it("não cria nem altera arquivo algum", () => {
    expect(ensaio().written).toEqual([]);
  });

  // SPECSFY: US-003 FR-004 NFR-002 AC-007
  it("não grava o registro", () => {
    expect(ensaio().record).toBeNull();
  });
});
