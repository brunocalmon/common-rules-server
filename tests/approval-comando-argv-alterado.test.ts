import { describe, it, expect } from "vitest";
import { partitionByApproval } from "../src/approval/plan";
import { registryFake, itemFake } from "./approval-command-fixtures";

describe("AC-113 — comando com argv alterado pede aprovação de novo", () => {
  // SPECSFY: US-070 FR-072 FR-073 NFR-070 AC-113
  it("ponte Python com versão diferente da registrada aparece como pendência", () => {
    const registrado = { bin: "uv", args: ["pip", "install", "--python", ".venv-crg", "code-review-graph==2.3.7"] };
    const novo = itemFake("bridge", "instalar code-review-graph via uv", "uv", [
      "pip",
      "install",
      "--python",
      ".venv-crg",
      "code-review-graph==2.4.0",
    ]);
    const registro = registryFake([registrado]);
    const { pending, approved } = partitionByApproval(registro, [novo]);
    expect(pending).toEqual([novo]);
    expect(approved).toEqual([]);
  });
});
