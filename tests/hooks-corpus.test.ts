import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { readHook } from "../src/hooks/source";
import { translateForClaudeCode, renderSettings, extractScripts, unwrap } from "../src/hooks/claude-code";

const CORPUS = resolve(__dirname, "../resources/hooks");
const nomes = () =>
  readdirSync(CORPUS).filter((f) => f.endsWith(".md") && f !== "README.md").map((f) => f.slice(0, -3));

describe("AC-013 — os sete hooks reais sobrevivem à ida e à volta", () => {
  // SPECSFY: US-002 FR-005 AC-013
  it("encontra exatamente os sete hooks portados", () => {
    expect(nomes()).toHaveLength(7);
  });

  // SPECSFY: US-002 FR-002 NFR-003 AC-013
  it("recupera os sete scripts idênticos aos originais", () => {
    for (const n of nomes()) {
      const original = readHook(readFileSync(resolve(CORPUS, `${n}.md`), "utf8"));
      const volta = unwrap(extractScripts(renderSettings([translateForClaudeCode(original)]))[0] ?? "");
      expect(volta, `hook ${n} corrompido na tradução`).toBe(original.script);
    }
  });

  // SPECSFY: US-002 FR-002 NFR-003 AC-013
  it("preserva a contagem de caracteres hostis em cada um", () => {
    const hostis = (s: string) => (s.match(/["'\\$]/g) ?? []).length;
    for (const n of nomes()) {
      const original = readHook(readFileSync(resolve(CORPUS, `${n}.md`), "utf8"));
      const volta = unwrap(extractScripts(renderSettings([translateForClaudeCode(original)]))[0] ?? "");
      expect(hostis(volta), `hook ${n}`).toBe(hostis(original.script));
    }
  });
});
