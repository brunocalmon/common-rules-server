import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

export interface ApprovedCommand {
  bin: string;
  args: string[];
}

export interface ApprovalRegistry {
  commands: ApprovedCommand[];
}

/**
 * Fonte de leitura/escrita, injetada no mesmo padrão de `BackendEnvironment`
 * (fatia 1d) — a suíte nunca depende do disco de quem a executa.
 */
export interface RegistryEnvironment {
  read(): string;
  write(contents: string): void;
}

export const REGISTRY_PATH = ".common-rules/approved-commands.json";

export function realRegistryEnvironment(root: string): RegistryEnvironment {
  const caminho = join(root, REGISTRY_PATH);
  return {
    read: () => (existsSync(caminho) ? readFileSync(caminho, "utf8") : ""),
    write: (contents: string) => {
      mkdirSync(dirname(caminho), { recursive: true });
      writeFileSync(caminho, contents);
    },
  };
}

/** JSON ausente, vazio ou inválido resolve para registro vazio — nunca lança (`AC-119`). */
export function readApprovalRegistry(env: RegistryEnvironment): ApprovalRegistry {
  const bruto = env.read().trim();
  if (bruto.length === 0) return { commands: [] };
  try {
    const valor = JSON.parse(bruto) as unknown;
    if (typeof valor !== "object" || valor === null || !Array.isArray((valor as ApprovalRegistry).commands)) {
      return { commands: [] };
    }
    return { commands: (valor as ApprovalRegistry).commands };
  } catch {
    return { commands: [] };
  }
}

export function writeApprovalRegistry(registry: ApprovalRegistry, env: RegistryEnvironment): void {
  env.write(JSON.stringify(registry, null, 2));
}

/** Identidade exata — binário e argv, mesmo comprimento, sem normalização (`PR-070`). */
export function isApproved(registry: ApprovalRegistry, item: { bin: string; args: string[] }): boolean {
  return registry.commands.some(
    (c) => c.bin === item.bin && c.args.length === item.args.length && c.args.every((a, i) => a === item.args[i]),
  );
}
