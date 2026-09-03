import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, fixedDecision } from "./aprovacao-fixtures";

describe("AC-136 — CLAUDE.md gets common-rules' own section on the first setup", () => {
  // SPECSFY: US-082 FR-086 FR-087 NFR-083 AC-136
  it("setup runs for the first time and CLAUDE.md gets the router's anchored block", () => {
    const root = project();
    runSetup({
      env: detectEnvironment(root),
      root,
      write: true,
      approval: { source: fixedDecision(true) },
    });

    const path = join(root, "CLAUDE.md");
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, "utf8");
    expect(content).toContain("<!-- common-rules:extension:router:start -->");
    expect(content).toContain("<!-- common-rules:extension:router:end -->");

    const registry = JSON.parse(readFileSync(join(root, ".common-rules", "extensions.json"), "utf8"));
    expect(registry.artifacts.some((a: { target: string }) => a.target === "CLAUDE.md")).toBe(true);
  });
});
