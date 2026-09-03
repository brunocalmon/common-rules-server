import { describe, it, expect } from "vitest";
import { createExtension } from "../src/extensions/create";
import { checksumEnvFake, targetEnvFake } from "./extensions-fixtures";

describe("AC-132 — conflito de nome pede escolha explícita, sem default silencioso", () => {
  // SPECSFY: US-080 FR-080 FR-081 FR-082 AC-132
  it("nome já registrado gera anúncio de conflito, sem aplicar pular nem substituir", () => {
    const registryEnv = checksumEnvFake();
    const targetEnv = targetEnvFake();
    const primeira = createExtension({
      category: "extension",
      name: "minha-extensao",
      target: "meu-hook",
      content: "primeira versão",
      registryEnv,
      targetEnv,
      managedHooks: [],
    });
    expect(primeira.ok).toBe(true);

    const segunda = createExtension({
      category: "extension",
      name: "minha-extensao",
      target: "meu-hook",
      content: "segunda versão",
      registryEnv,
      targetEnv,
      managedHooks: [],
    });
    expect(segunda.ok).toBe(false);
    expect(segunda.reason).toMatch(/conflito/i);
    expect(segunda.reason).toMatch(/pular/i);
    expect(segunda.reason).toMatch(/substituir/i);
  });
});
