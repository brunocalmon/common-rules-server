import { describe, it, expect } from "vitest";
import { detectBackends } from "../src/backends/detect";
import { fonteFake } from "./backends-fixtures";

describe("AC-082 — backend não suportado presente aparece como tal, não como ausente", () => {
  // SPECSFY: US-031 FR-032 FR-033 AC-082
  it("dsh presente e não suportado é distinto de ausente", () => {
    const { env } = fonteFake({ dsh: "0.1.1-rc.1" });
    const resultado = detectBackends(env);
    const dsh = resultado.find((r) => r.name === "dsh");
    expect(dsh?.present).toBe(true);
    expect(dsh?.supported).toBe(false);

    const pi = resultado.find((r) => r.name === "pi");
    expect(pi?.present).toBe(false);
  });
});
