import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { realSkillsExecutor } from "../src/skills/executor";

function cleanRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "crs-skex-"));
  writeFileSync(join(root, "package.json"), '{"name":"disposable"}\n');
  return root;
}

describe("AC-036 — real skills executor, without a fixture", () => {
  // `retry`: real network fetch (see specsfy-install-real.test.ts for why).
  // SPECSFY: FR-020 AC-036
  it(
    "--list recognizes real skills from mattpocock/skills",
    { timeout: 30_000, retry: 2 },
    () => {
      const root = cleanRoot();
      const execute = realSkillsExecutor();
      const r = execute(["add", "mattpocock/skills", "-a", "claude-code", "--skill", "*", "--copy", "-y", "--list"], root);
      expect(r).not.toBeNull();
      expect(r?.status).toBe(0);
      expect(r?.skills?.length ?? 0).toBeGreaterThan(0);
    },
  );

  // SPECSFY: FR-027 AC-036
  it(
    "--list recognizes real skills from promovaweb/specsfy",
    { timeout: 30_000, retry: 2 },
    () => {
      const root = cleanRoot();
      const execute = realSkillsExecutor();
      const r = execute(["add", "promovaweb/specsfy", "-a", "claude-code", "--skill", "*", "--copy", "-y", "--list"], root);
      expect(r).not.toBeNull();
      expect(r?.status).toBe(0);
      expect(r?.skills?.length ?? 0).toBeGreaterThan(0);
    },
  );
});
