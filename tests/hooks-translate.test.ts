import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { translateForClaudeCode } from "../src/hooks/claude-code";
import { readHook } from "../src/hooks/source";

const CORPUS = resolve(__dirname, "../specs/defined/0003-fatia-1b-setup-hooks/research/hooks-v028");
const hook = (n: string) => readHook(readFileSync(resolve(CORPUS, `${n}.md`), "utf8"));

describe("AC-009 — a tradução preserva a semântica de bloqueio", () => {
  // SPECSFY: US-002 FR-002 FR-003 FR-006 AC-009
  it("faz hook declarado bloqueante produzir entrada que interrompe", () => {
    for (const n of ["guard-destructive", "guard-secrets", "protect-authorship"]) {
      expect(translateForClaudeCode(hook(n)).blocking).toBe(true);
    }
  });

  // SPECSFY: US-002 FR-002 FR-006 AC-009
  it("faz hook não bloqueante produzir entrada que apenas observa", () => {
    for (const n of ["context-mode-posttooluse", "code-review-graph-update"]) {
      expect(translateForClaudeCode(hook(n)).blocking).toBe(false);
    }
  });

  // SPECSFY: US-002 FR-002 NFR-003 AC-009
  it("mapeia cada evento canônico para o nome que o alvo usa", () => {
    expect(translateForClaudeCode(hook("guard-secrets")).event).toBe("PreToolUse");
    expect(translateForClaudeCode(hook("code-review-graph-update")).event).toBe("PostToolUse");
    expect(translateForClaudeCode(hook("context-mode-stop")).event).toBe("Stop");
  });
});
