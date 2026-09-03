import { describe, it, expect } from "vitest";
import { inspectDependencies } from "../src/doctor";
import { noBackends } from "./backends-fixtures";

// code-review-graph absent from both sources; the npm ones resolve normally.
const noCrg = {
  resolveNpm: (name: string) =>
    ({ "@promovaweb/specsfy": "0.10.2", "context-mode": "1.0.169" })[name] ?? null,
  resolveLocalPython: () => null,
  resolveOnPath: () => null,
};

const crg = () => inspectDependencies(noCrg, undefined, noBackends).results.find((r) => r.name === "code-review-graph");

describe("AC-006 — doctor fails, naming the absent one", () => {
  // SPECSFY: US-002 FR-006 AC-006
  it("names code-review-graph as absent", () => {
    expect(crg()?.present).toBe(false);
  });

  // SPECSFY: US-002 FR-006 AC-006
  it("explains that the tool comes from uv, not npm", () => {
    expect(String(crg()?.hint)).toMatch(/uv/i);
  });

  // SPECSFY: US-002 FR-004 AC-006
  it("keeps the approved npm dependencies, isolating the failure", () => {
    const npm = inspectDependencies(noCrg, undefined, noBackends).results.filter((r) => r.layer === "npm");
    expect(npm.every((r) => r.present)).toBe(true);
  });

  // SPECSFY: US-002 FR-006 AC-006
  it("fails the set, with a non-zero exit code", () => {
    expect(inspectDependencies(noCrg, undefined, noBackends).exitCode).not.toBe(0);
  });
});
