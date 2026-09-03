import { describe, it, expect } from "vitest";
import { repairExtension } from "../src/extensions/repair";
import { registryFake, targetEnvFake } from "./extensions-fixtures";
import { computeChecksum } from "../src/extensions/anchor";

describe("AC-139 — quarentena não gravável recusa o reparo inteiro", () => {
  // SPECSFY: US-081 FR-084 FR-085 NFR-080 NFR-081 AC-139
  it("diretório de quarentena não gravável mantém o divergente exatamente como estava", () => {
    const alvo = ".common-rules/extensions/meu-hook.md";
    const targetEnv = targetEnvFake({ [alvo]: "# conteúdo divergente" });
    const antes = { ...targetEnv.files() };
    const registro = registryFake([
      { category: "extension", name: "minha-extensao", target: "meu-hook", content: "outra coisa", checksum: computeChecksum("outra coisa"), createdAt: "2026-09-02T00:00:00.000Z" },
    ]);
    const divergente = { name: "minha-extensao", target: "meu-hook", reason: "checksum-mismatch" as const };

    const resultado = repairExtension(divergente, {
      registry: registro,
      targetEnv,
      quarantineEnv: {
        write: () => {
          throw new Error("quarentena não gravável");
        },
      },
    });

    expect(resultado.ok).toBe(false);
    expect(targetEnv.files()).toEqual(antes);
  });
});
