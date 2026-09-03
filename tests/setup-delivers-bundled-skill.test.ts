import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projeto, decisaoFixa } from "./aprovacao-fixtures";

describe("setup delivers the bundled common-rules-extension-creator skill", () => {
  // SPECSFY: US-080 US-082 FR-088 AC-140
  it("copies SKILL.md into both .claude/skills/ and .agents/skills/ on first run", () => {
    const raiz = projeto();
    runSetup({
      env: detectEnvironment(raiz),
      root: raiz,
      write: true,
      approval: { source: decisaoFixa(true) },
    });

    for (const dir of [".claude/skills", ".agents/skills"]) {
      const caminho = join(raiz, dir, "common-rules-extension-creator", "SKILL.md");
      expect(existsSync(caminho)).toBe(true);
      expect(readFileSync(caminho, "utf8")).toMatch(/common-rules extension create/);
    }
  });
});
