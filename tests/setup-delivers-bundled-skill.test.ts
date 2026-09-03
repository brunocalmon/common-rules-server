import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, fixedDecision } from "./aprovacao-fixtures";

describe("setup delivers the bundled common-rules-extension-creator skill", () => {
  // SPECSFY: US-080 US-082 FR-088 AC-140
  it("copies SKILL.md into both .claude/skills/ and .agents/skills/ on first run", () => {
    const root = project();
    runSetup({
      env: detectEnvironment(root),
      root,
      write: true,
      approval: { source: fixedDecision(true) },
    });

    for (const dir of [".claude/skills", ".agents/skills"]) {
      const path = join(root, dir, "common-rules-extension-creator", "SKILL.md");
      expect(existsSync(path)).toBe(true);
      expect(readFileSync(path, "utf8")).toMatch(/common-rules extension create/);
    }
  });
});
