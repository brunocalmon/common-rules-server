import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { realSpecsfyExecutor } from "../src/specsfy/executor";

function raizGit(): string {
  const raiz = mkdtempSync(join(tmpdir(), "crs-spex-"));
  execSync("git init -q .", { cwd: raiz });
  return raiz;
}

describe("AC-038 — executor real do specsfy install, sem fixture", () => {
  // SPECSFY: FR-028 FR-029 AC-038
  it("grava .specsfy/, .agents/skills/, CLAUDE.md e AGENTS.md de verdade", () => {
    const raiz = raizGit();
    const execute = realSpecsfyExecutor();
    const r = execute(raiz);
    expect(r).not.toBeNull();
    expect(r?.status).toBe(0);
    expect(r?.changed ?? 0).toBeGreaterThan(0);
    expect(existsSync(join(raiz, ".specsfy"))).toBe(true);
    expect(existsSync(join(raiz, ".agents", "skills"))).toBe(true);
    expect(existsSync(join(raiz, "CLAUDE.md"))).toBe(true);
    expect(existsSync(join(raiz, "AGENTS.md"))).toBe(true);
  }, 30_000);
});
