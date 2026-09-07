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
  // `retry`: this hits the real specsfy installer, which fetches skill
  // sources over the network — a shared CI runner's IP occasionally gets a
  // transient failure (rate limit, DNS hiccup) that a fresh attempt from
  // the same machine doesn't reproduce. Retrying is about that class of
  // flake, not about tolerating a real regression: a consistent failure
  // still fails after the retries run out.
  it(
    "really writes .specsfy/, .agents/skills/, CLAUDE.md and AGENTS.md",
    { timeout: 30_000, retry: 2 },
    () => {
      const root = gitRoot();
      const execute = realSpecsfyExecutor();
      const r = execute(root);
      expect(r).not.toBeNull();
      // The installer's own reason travels with the assertion: a CI-only
      // failure that says just "expected 1 to be 0" sends whoever reads it
      // hunting blind, which is what happened the first time this broke.
      expect(r?.status, `installer failed: ${r?.reason ?? "(no reason captured)"}`).toBe(0);
      expect(r?.changed ?? 0).toBeGreaterThan(0);
      expect(existsSync(join(root, ".specsfy"))).toBe(true);
      expect(existsSync(join(root, ".agents", "skills"))).toBe(true);
      expect(existsSync(join(root, "CLAUDE.md"))).toBe(true);
      expect(existsSync(join(root, "AGENTS.md"))).toBe(true);
    },
  );
});
