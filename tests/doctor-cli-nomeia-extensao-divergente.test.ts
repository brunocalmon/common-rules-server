import { describe, it, expect } from "vitest";
import { renderReport } from "../src/cli";
import type { Report } from "../src/doctor";

const reportBase: Report = {
  results: [{ name: "@promovaweb/specsfy", layer: "npm", present: true, origin: "local", version: "1.0.0" }],
  exitCode: 1,
};

describe("AC-133 — doctor's text names the divergent extension artifact", () => {
  // SPECSFY: US-081 FR-083 FR-085 NFR-080 NFR-082 AC-133
  it("names each divergent artifact in the rendered text", () => {
    const report: Report = {
      ...reportBase,
      divergentExtensions: [{ name: "my-extension", target: "my-hook", reason: "checksum-mismatch" }],
    };
    const text = renderReport(report);
    expect(text).toMatch(/my-extension/);
    expect(text).toMatch(/checksum-mismatch/);
  });

  // SPECSFY: US-081 FR-083 FR-085 NFR-080 NFR-082 AC-133
  it("with no divergence, no extra line appears", () => {
    const text = renderReport(reportBase);
    expect(text).not.toMatch(/divergent/);
  });
});
