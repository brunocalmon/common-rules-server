import { describe, it, expect } from "vitest";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projectWithSkills, dualSourceExecutor } from "./skills-fixtures";
import { decisionThatThrowsIfCalled } from "./aprovacao-fixtures";
import type { Executor as SpecsfyExecutor } from "../src/specsfy/install";

function fakeSpecsfyExecutor(root: string) {
  let calls = 0;
  const fn: SpecsfyExecutor = (root) => {
    calls += 1;
    mkdirSync(join(root, ".specsfy"), { recursive: true });
    return { status: 0, changed: 1, paths: [join(root, ".specsfy")] };
  };
  return { fn, count: () => calls };
}

function specsfyExecutorThatThrowsIfCalled(): SpecsfyExecutor {
  return () => {
    throw new Error("shouldn't be called: nothing changed since the previous record");
  };
}

describe("AC-079 — nothing absent preserves the original short-circuit", () => {
  const configured = () => {
    const root = projectWithSkills();
    const env = detectEnvironment(root);
    const skillsEx = dualSourceExecutor();
    const specsfyEx = fakeSpecsfyExecutor(root);
    const first = runSetup({
      env, root, write: true,
      skills: { execute: skillsEx.fn },
      specsfy: { execute: specsfyEx.fn },
    });
    return { root, env, previous: first.record, specsfyCallsOnFirst: specsfyEx.count() };
  };

  // SPECSFY: US-020 US-023 FR-030 AC-079
  it("control: the first run actually calls the executors, proving the mechanism exists", () => {
    const { specsfyCallsOnFirst } = configured();
    expect(specsfyCallsOnFirst).toBeGreaterThan(0);
  });

  // SPECSFY: US-020 US-023 FR-030 AC-079
  it("hooks, skills and framework intact: no executor is invoked on the second run", () => {
    const { root, env, previous } = configured();
    expect(() => runSetup({
      env, root, write: true, previous,
      skills: { execute: () => { throw new Error("shouldn't be called: skills intact"); } },
      specsfy: { execute: specsfyExecutorThatThrowsIfCalled() },
      approval: { source: decisionThatThrowsIfCalled() },
    })).not.toThrow();
  });

  // SPECSFY: US-020 US-023 FR-030 AC-079
  it("the report states it was already configured", () => {
    const { root, env, previous } = configured();
    const second = runSetup({
      env, root, write: true, previous,
      skills: { execute: () => { throw new Error("shouldn't be called: skills intact"); } },
      specsfy: { execute: specsfyExecutorThatThrowsIfCalled() },
      approval: { source: decisionThatThrowsIfCalled() },
    });
    expect(second.report).toMatch(/already configured/i);
    expect(second.exitCode).toBe(0);
  });
});
