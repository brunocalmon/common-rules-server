import { describe, it, expect } from "vitest";
import { createExtension } from "../src/extensions/create";
import { readExtensionRegistry } from "../src/extensions/registry";
import { checksumEnvFake, targetEnvFake } from "./extensions-fixtures";

describe("AC-130 — extensão criada pela CLI sobrevive a uma reinstalação", () => {
  // SPECSFY: US-080 FR-080 FR-081 FR-082 NFR-083 AC-130
  it("uma segunda leitura do registro reconhece o mesmo checksum", () => {
    const registryEnv = checksumEnvFake();
    const targetEnv = targetEnvFake();
    const r = createExtension({
      category: "extension",
      name: "minha-extensao",
      target: "meu-hook",
      content: "# conteúdo customizado",
      registryEnv,
      targetEnv,
      managedHooks: [],
    });
    expect(r.ok).toBe(true);

    const registro = readExtensionRegistry(registryEnv);
    const artefato = registro.artifacts.find((a) => a.name === "minha-extensao");
    expect(artefato).toBeDefined();
    expect(artefato?.checksum).toBe(r.artifact?.checksum);
  });
});
