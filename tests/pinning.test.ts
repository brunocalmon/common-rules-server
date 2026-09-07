import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Versions checked against the npm registry on 2026-08-24.
// `@promovaweb/specsfy` moved 0.10.2 → 0.22.2 on 2026-09-07, while chasing a
// CI-only install failure. The bump didn't fix it: 0.22.2 still shells out to
// `npx skills`, so the failure's real cause — a broken package tree in the
// runner's npx cache — is untouched by the version. The pin moved anyway,
// because staying twelve minors behind for no reason is its own cost.
const PINNED: Record<string, string> = {
  "@promovaweb/specsfy": "0.22.2",
  "context-mode": "1.0.169",
};

const deps = () =>
  JSON.parse(readFileSync(resolve(__dirname, "../package.json"), "utf8")).dependencies ?? {};

describe("AC-007 — pinned versions, no range", () => {
  for (const [name, version] of Object.entries(PINNED)) {
    // SPECSFY: US-001 FR-004 NFR-002 AC-007
    it(`pins ${name} at ${version}, exactly`, () => {
      expect(deps()[name]).toBe(version);
    });
  }

  // SPECSFY: US-001 FR-004 NFR-002 AC-007
  it("doesn't pin the pi agent, which belongs to the backends layer", () => {
    // The guard keeps pi's absence from being true only because no
    // dependency has been declared yet.
    expect(Object.keys(deps()).length).toBeGreaterThan(0);
    expect(deps()["@earendil-works/pi-coding-agent"]).toBeUndefined();
  });
});
