import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const cli = resolve(__dirname, "..", "dist", "cli.js");
const approved = JSON.stringify({ approved: true });

function projectWithTarget(): string {
  const root = mkdtempSync(join(tmpdir(), "crs-drift-"));
  mkdirSync(join(root, ".claude"), { recursive: true });
  return root;
}

function run(root: string) {
  return spawnSync("node", [cli, "setup"], { cwd: root, encoding: "utf8", input: approved, timeout: 120_000 });
}

describe("AC-077 — deleted skills are restored even with hooks already configured", () => {
  // SPECSFY: US-020 FR-030 AC-077
  it("rm -rf .claude/skills followed by setup restores the skills", () => {
    const root = projectWithTarget();
    run(root);
    expect(existsSync(join(root, ".claude", "skills"))).toBe(true);

    rmSync(join(root, ".claude", "skills"), { recursive: true, force: true });
    expect(existsSync(join(root, ".claude", "skills"))).toBe(false);

    const second = run(root);
    expect(second.stdout).not.toMatch(/^already configured/);
    expect(existsSync(join(root, ".claude", "skills"))).toBe(true);
  }, 180_000);
});

describe("AC-078 — a deleted Specsfy framework is restored even with hooks already configured", () => {
  // SPECSFY: US-023 FR-030 AC-078
  it("rm -rf .specsfy followed by setup restores the framework", () => {
    const root = projectWithTarget();
    run(root);
    expect(existsSync(join(root, ".specsfy"))).toBe(true);

    rmSync(join(root, ".specsfy"), { recursive: true, force: true });
    expect(existsSync(join(root, ".specsfy"))).toBe(false);

    const second = run(root);
    expect(second.stdout).not.toMatch(/^already configured/);
    expect(existsSync(join(root, ".specsfy"))).toBe(true);
  }, 180_000);
});
