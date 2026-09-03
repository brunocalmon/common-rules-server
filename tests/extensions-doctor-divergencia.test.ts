import { describe, it, expect } from "vitest";
import { diagnoseExtensions } from "../src/extensions/diagnose";
import { registryFake, targetEnvFake } from "./extensions-fixtures";
import { computeChecksum } from "../src/extensions/anchor";
import { insertAnchor } from "../src/extensions/anchor";

describe("AC-133 — doctor detecta divergência sem alterar nada", () => {
  // SPECSFY: US-081 FR-083 FR-085 NFR-080 NFR-082 AC-133
  it("artefato editado fora da CLI é nomeado como divergente, sem escrita", () => {
    const conteudoOriginal = "# conteúdo gerado pela CLI";
    const anchored = insertAnchor("", "extension", "minha-extensao", conteudoOriginal);
    const targetEnv = targetEnvFake({
      ".common-rules/extensions/meu-hook.md": anchored.replace(conteudoOriginal, "# ALGUÉM EDITOU ISSO À MÃO"),
    });
    const registro = registryFake([
      {
        category: "extension",
        name: "minha-extensao",
        target: "meu-hook",
        content: conteudoOriginal,
        checksum: computeChecksum(conteudoOriginal),
        createdAt: "2026-09-02T00:00:00.000Z",
      },
    ]);

    const antes = { ...targetEnv.files() };
    const divergentes = diagnoseExtensions(registro, targetEnv, []);

    expect(divergentes).toHaveLength(1);
    expect(divergentes[0].name).toBe("minha-extensao");
    expect(divergentes[0].reason).toBe("checksum-mismatch");
    expect(targetEnv.files()).toEqual(antes);
  });
});
