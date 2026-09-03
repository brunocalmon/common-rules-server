import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { readHook } from "../src/hooks/source";
import { translateForClaudeCode, renderSettings, extractScripts, unwrap } from "../src/hooks/claude-code";

const CORPUS = resolve(__dirname, "../resources/hooks");
const names = () =>
  readdirSync(CORPUS).filter((f) => f.endsWith(".md") && f !== "README.md").map((f) => f.slice(0, -3));

describe("AC-013 — the seven real hooks survive the round trip", () => {
  // SPECSFY: US-002 FR-005 AC-013
  it("finds exactly the seven ported hooks", () => {
    expect(names()).toHaveLength(7);
  });

  // SPECSFY: US-002 FR-002 NFR-003 AC-013
  it("recovers the seven scripts identical to the originals", () => {
    for (const n of names()) {
      const original = readHook(readFileSync(resolve(CORPUS, `${n}.md`), "utf8"));
      const back = unwrap(extractScripts(renderSettings([translateForClaudeCode(original)]))[0] ?? "");
      expect(back, `hook ${n} corrupted in translation`).toBe(original.script);
    }
  });

  // SPECSFY: US-002 FR-002 NFR-003 AC-013
  it("preserves the count of hostile characters in each one", () => {
    const hostile = (s: string) => (s.match(/["'\\$]/g) ?? []).length;
    for (const n of names()) {
      const original = readHook(readFileSync(resolve(CORPUS, `${n}.md`), "utf8"));
      const back = unwrap(extractScripts(renderSettings([translateForClaudeCode(original)]))[0] ?? "");
      expect(hostile(back), `hook ${n}`).toBe(hostile(original.script));
    }
  });
});
