import { describe, it, expect } from "vitest";
import { diagnoseExtensions } from "../src/extensions/diagnose";
import { registryFake, targetEnvFake } from "./extensions-fixtures";
import { computeChecksum, insertAnchor } from "../src/extensions/anchor";

describe("AC-133/AC-135 — presença em disco é resolvida por target, não por name", () => {
  // SPECSFY: US-081 FR-083 NFR-080 NFR-082 AC-133 AC-135
  it("artefato íntegro cujo name difere do target não é falsamente relatado como órfão", () => {
    const conteudo = "# conteúdo original";
    const anchored = insertAnchor("", "extension", "minha-extensao", conteudo);
    const targetEnv = targetEnvFake({ ".common-rules/extensions/meu-hook.md": anchored });
    const registro = registryFake([
      {
        category: "extension",
        name: "minha-extensao",
        target: "meu-hook",
        content: conteudo,
        checksum: computeChecksum(conteudo),
        createdAt: "2026-09-02T00:00:00.000Z",
      },
    ]);

    // `listPresentExtensionNames` real devolve o nome do arquivo — igual ao target, não ao name.
    const divergentes = diagnoseExtensions(registro, targetEnv, ["meu-hook"]);
    expect(divergentes).toHaveLength(0);
  });
});
