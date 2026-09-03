import { describe, it, expect } from "vitest";
import { inspectSkills } from "../src/skills/inventory";
import { projectWithSkills, replaceWithSymlink } from "./skills-fixtures";

describe("AC-033 — a set present as a link is treated as invalid", () => {
  // SPECSFY: US-020 FR-021 AC-033
  it("the link is detected", () => {
    const root = projectWithSkills();
    replaceWithSymlink(root, "specsfy-setup");
    expect(inspectSkills(root).symlinks.length).toBeGreaterThan(0);
  });

  // SPECSFY: US-020 FR-022 AC-033
  it("the result is invalid", () => {
    const root = projectWithSkills();
    replaceWithSymlink(root, "specsfy-setup");
    expect(inspectSkills(root).ok).toBe(false);
  });

  // SPECSFY: US-020 NFR-022 AC-033
  it("the reason cites that the content needs to live inside the project", () => {
    const root = projectWithSkills();
    replaceWithSymlink(root, "specsfy-setup");
    expect(inspectSkills(root).reason ?? "").toMatch(/inside the project|link/i);
  });
});
