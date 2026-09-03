import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { realSpecsfyExecutor } from "../src/specsfy/executor";

function gitRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "crs-spex-"));
  execSync("git init -q .", { cwd: root });
  return root;
}

describe("AC-038 — real specsfy install executor, no fixture", () => {
  // SPECSFY: FR-028 FR-029 AC-038
  it("really writes .specsfy/, .agents/skills/, CLAUDE.md and AGENTS.md", () => {
    const root = gitRoot();
    const execute = realSpecsfyExecutor();
    const r = execute(root);
    expect(r).not.toBeNull();
    expect(r?.status).toBe(0);
    expect(r?.changed ?? 0).toBeGreaterThan(0);
    expect(existsSync(join(root, ".specsfy"))).toBe(true);
    expect(existsSync(join(root, ".agents", "skills"))).toBe(true);
    expect(existsSync(join(root, "CLAUDE.md"))).toBe(true);
    expect(existsSync(join(root, "AGENTS.md"))).toBe(true);
  }, 30_000);
});
