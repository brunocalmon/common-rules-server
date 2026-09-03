import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

export interface ExtensionArtifact {
  category: "override" | "extension" | "new";
  name: string;
  target: string;
  /** O conteúdo gerado pela CLI, entre as âncoras — é o que o reparo restaura; o checksum sozinho não permite reconstrução. */
  content: string;
  checksum: string;
  createdAt: string;
}

export interface ExtensionRegistry {
  artifacts: ExtensionArtifact[];
}

/**
 * Fonte de leitura/escrita, injetada no mesmo padrão de
 * `RegistryEnvironment` (fatia 1i, `src/approval/registry.ts`) — a suíte
 * nunca depende do disco de quem a executa.
 */
export interface ChecksumEnvironment {
  read(): string;
  write(contents: string): void;
}

export const REGISTRY_PATH = ".common-rules/extensions.json";

export function realChecksumEnvironment(root: string): ChecksumEnvironment {
  const caminho = join(root, REGISTRY_PATH);
  return {
    read: () => (existsSync(caminho) ? readFileSync(caminho, "utf8") : ""),
    write: (contents: string) => {
      mkdirSync(dirname(caminho), { recursive: true });
      writeFileSync(caminho, contents);
    },
  };
}

/** JSON ausente, vazio ou inválido resolve para registro vazio — nunca lança. */
export function readExtensionRegistry(env: ChecksumEnvironment): ExtensionRegistry {
  const bruto = env.read().trim();
  if (bruto.length === 0) return { artifacts: [] };
  try {
    const valor = JSON.parse(bruto) as unknown;
    if (typeof valor !== "object" || valor === null || !Array.isArray((valor as ExtensionRegistry).artifacts)) {
      return { artifacts: [] };
    }
    return { artifacts: (valor as ExtensionRegistry).artifacts };
  } catch {
    return { artifacts: [] };
  }
}

export function writeExtensionRegistry(registry: ExtensionRegistry, env: ChecksumEnvironment): void {
  env.write(JSON.stringify(registry, null, 2));
}
