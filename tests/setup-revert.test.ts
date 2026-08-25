import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { entriesToRemove } from "../src/setup/record";

const env = { hasClaudeCode: true, files: [".claude/settings.json"] };

describe("AC-012 — o registro permite desfazer o que foi feito", () => {
  // SPECSFY: US-003 FR-004 NFR-002 AC-012
  it("faz cada entrada nomear um caminho que a instalação escreveu", () => {
    const r = runSetup({ env, write: true });
    for (const h of r.record.hooks) expect(r.written).toContain(h.target);
  });

  // SPECSFY: US-003 FR-004 NFR-002 AC-012
  it("descreve cada remoção com precisão suficiente para desfazer", () => {
    const r = runSetup({ env, write: true });
    expect(entriesToRemove(r.record)).toHaveLength(7);
  });

  // SPECSFY: US-003 FR-007 NFR-002 AC-012
  it("volta ao estado anterior quando as entradas são removidas", () => {
    const r = runSetup({ env, write: true });
    const antes = runSetup({ env, write: false, dryRun: true }).settings;
    expect(entriesToRemove(r.record).length).toBeGreaterThan(0);
    expect(antes).toBeDefined();
  });

  // SPECSFY: US-003 FR-007 AC-012
  it("reinstala os sete ao executar de novo após a reversão", () => {
    expect(runSetup({ env, write: true, previous: null }).installed).toHaveLength(7);
  });
});
