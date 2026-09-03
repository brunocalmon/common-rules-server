import { describe, it, expect } from "vitest";
import { createExtension } from "../src/extensions/create";
import { checksumEnvFake, targetEnvFake } from "./extensions-fixtures";

describe("AC-131 — categoria new é recusada para os sete hooks", () => {
  // SPECSFY: US-080 FR-080 FR-081 FR-082 AC-131
  it("pedido de categoria new para um hook gerenciado é recusado com motivo", () => {
    const r = createExtension({
      category: "new",
      name: "hack",
      target: "guard-destructive",
      content: "# tentativa",
      registryEnv: checksumEnvFake(),
      targetEnv: targetEnvFake(),
      managedHooks: ["guard-destructive", "guard-secrets"],
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/new/i);
    expect(r.reason).toMatch(/override|extension/i);
  });
});
