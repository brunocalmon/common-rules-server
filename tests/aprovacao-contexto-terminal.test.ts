import { describe, it, expect } from "vitest";
import { resolveChannel } from "../src/approval/context";
import { fixedContext } from "./aprovacao-fixtures";

describe("AC-063 — with a terminal, the question is asked", () => {
  // SPECSFY: US-060 FR-061 AC-063
  it("the chosen channel is the interactive one", () => {
    expect(resolveChannel(fixedContext(true))).toBe("interactive");
  });

  // SPECSFY: US-060 FR-061 AC-063
  it("the choice depends only on the injected context", () => {
    expect(resolveChannel(fixedContext(true))).toBe(resolveChannel(fixedContext(true)));
  });

  // SPECSFY: US-060 FR-061 AC-063
  it("a declared terminal never results in the document channel", () => {
    expect(resolveChannel(fixedContext(true))).not.toBe("document");
  });
});
