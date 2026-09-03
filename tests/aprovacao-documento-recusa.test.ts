import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { fileTree, project } from "./aprovacao-fixtures";

describe("AC-066 — the document denies the run", () => {
  const run = (root: string) => runSetup({
    env: detectEnvironment(root), root, write: true,
    approval: { context: { hasTerminal: () => false }, stdin: { read: () => '{"approved": false}' } },
  });

  // SPECSFY: US-061 FR-062 FR-064 AC-066
  it("no file is created", () => {
    const root = project();
    const before = fileTree(root);
    run(root);
    expect(fileTree(root)).toEqual(before);
  });

  // SPECSFY: US-061 FR-064 AC-066
  it("the report states the refusal", () => {
    const root = project();
    expect(run(root).report).toMatch(/refused/i);
  });

  // SPECSFY: US-061 FR-062 AC-066
  it("the exit code isn't a success one", () => {
    const root = project();
    expect(run(root).exitCode).not.toBe(0);
  });
});
