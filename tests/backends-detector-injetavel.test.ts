import { describe, it, expect } from "vitest";
import { detectBackends } from "../src/backends/detect";
import { fonteFake } from "./backends-fixtures";

describe("AC-084 — o detector aceita fonte injetada", () => {
  // SPECSFY: US-032 FR-030 NFR-032 AC-084
  it("o resultado reflete exatamente a fonte fake, sem tocar o PATH real", () => {
    const { env } = fonteFake({ pi: "0.84.3", agy: "1.1.20", claude: "2.1.251", goose: "1.47.0" });
    const resultado = detectBackends(env);
    expect(resultado.find((r) => r.name === "codex")?.present).toBe(false);
    expect(resultado.find((r) => r.name === "pi")?.present).toBe(true);
  });
});
