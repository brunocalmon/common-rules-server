import { describe, it, expect } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createExtension } from "../src/extensions/create";
import { diagnoseExtensions } from "../src/extensions/diagnose";
import { repairExtension } from "../src/extensions/repair";
import { readExtensionRegistry, writeExtensionRegistry } from "../src/extensions/registry";
import type { ChecksumEnvironment } from "../src/extensions/registry";
import type { TargetFileEnvironment } from "../src/extensions/create";

function realRegistryEnv(dir: string): ChecksumEnvironment {
  const path = join(dir, "extensions.json");
  return {
    read: () => (existsSync(path) ? readFileSync(path, "utf8") : ""),
    write: (contents: string) => {
      mkdirSync(dir, { recursive: true });
      writeFileSync(path, contents);
    },
  };
}

function realTargetEnv(dir: string): TargetFileEnvironment {
  return {
    read: (path: string) => {
      const full = join(dir, path);
      return existsSync(full) ? readFileSync(full, "utf8") : "";
    },
    write: (path: string, content: string) => {
      const full = join(dir, path);
      mkdirSync(join(full, ".."), { recursive: true });
      writeFileSync(full, content);
    },
  };
}

describe("AC-134 — reparo move o divergente para quarentena e restaura o original", () => {
  // SPECSFY: US-081 FR-083 FR-084 FR-085 NFR-081 NFR-082 AC-134
  it("de verdade num diretório temporário: criar, divergir, reparar", () => {
    const raiz = mkdtempSync(join(tmpdir(), "crs-ext-"));
    const registryEnv = realRegistryEnv(join(raiz, ".common-rules"));
    const targetEnv = realTargetEnv(raiz);

    const criado = createExtension({
      category: "extension",
      name: "minha-extensao",
      target: "meu-hook",
      content: "# conteúdo original",
      registryEnv,
      targetEnv,
      managedHooks: [],
    });
    expect(criado.ok).toBe(true);

    const alvoReal = ".common-rules/extensions/meu-hook.md";
    const conteudoDivergente = targetEnv.read(alvoReal).replace("# conteúdo original", "# alguém editou à mão");
    targetEnv.write(alvoReal, conteudoDivergente);

    const registro = readExtensionRegistry(registryEnv);
    const divergentes = diagnoseExtensions(registro, targetEnv, []);
    expect(divergentes).toHaveLength(1);

    const quarantineDir = join(raiz, ".common-rules", "quarantine");
    const resultado = repairExtension(divergentes[0], {
      registry: registro,
      targetEnv,
      quarantineEnv: {
        write: (name: string, content: string) => {
          mkdirSync(quarantineDir, { recursive: true });
          writeFileSync(join(quarantineDir, name), content);
        },
      },
    });

    expect(resultado.ok).toBe(true);
    expect(existsSync(quarantineDir)).toBe(true);
    expect(readdirSync(quarantineDir).length).toBeGreaterThan(0);
    expect(targetEnv.read(alvoReal)).toContain("# conteúdo original");

    const registroFinal = readExtensionRegistry(registryEnv);
    expect(diagnoseExtensions(registroFinal, targetEnv, [])).toHaveLength(0);
  });
});
