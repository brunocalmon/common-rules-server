import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, fixedDecision } from "./aprovacao-fixtures";

/**
 * Real bug, found by running `common-rules setup` for real in this very
 * repository: hooks recorded in a previous run with no `skills`
 * configured left `previousSkills` empty, and the old
 * `skillsAlreadyDone = ... || previousSkills.length === 0 || ...` treated
 * "no previous record" as "already done" — a following run with `skills`
 * configured would never actually install anything.
 */
describe("A hooks record without previous skills doesn't pretend skills were already installed", () => {
  it("first run without skills, second with skills configured: the executor is actually called", () => {
    const root = project();
    const env = detectEnvironment(root);

    const first = runSetup({ env, root, write: true, approval: { source: fixedDecision(true) } });
    expect(first.record?.skills).toBeUndefined();

    let called = false;
    runSetup({
      env,
      root,
      write: true,
      previous: first.record,
      skills: {
        execute: (args, cwd) => {
          called = true;
          return { status: 0, skills: ["example"] };
        },
      },
      approval: { source: fixedDecision(true) },
    });

    expect(called).toBe(true);
  });
});
