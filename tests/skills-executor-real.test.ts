import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { realSkillsExecutor } from "../src/skills/executor";

function raizLimpa(): string {
  const raiz = mkdtempSync(join(tmpdir(), "crs-skex-"));
  writeFileSync(join(raiz, "package.json"), '{"name":"descartavel"}\n');
  return raiz;
}

describe("AC-036 — executor real do skills, sem fixture", () => {
  // SPECSFY: FR-020 AC-036
  it("--list reconhece skills reais de mattpocock/skills", () => {
    const raiz = raizLimpa();
    const execute = realSkillsExecutor();
    const r = execute(["add", "mattpocock/skills", "-a", "claude-code", "--skill", "*", "--copy", "-y", "--list"], raiz);
    expect(r).not.toBeNull();
    expect(r?.status).toBe(0);
    expect(r?.skills?.length ?? 0).toBeGreaterThan(0);
  }, 30_000);

  // SPECSFY: FR-027 AC-036
  it("--list reconhece skills reais de promovaweb/specsfy", () => {
    const raiz = raizLimpa();
    const execute = realSkillsExecutor();
    const r = execute(["add", "promovaweb/specsfy", "-a", "claude-code", "--skill", "*", "--copy", "-y", "--list"], raiz);
    expect(r).not.toBeNull();
    expect(r?.status).toBe(0);
    expect(r?.skills?.length ?? 0).toBeGreaterThan(0);
  }, 30_000);
});
