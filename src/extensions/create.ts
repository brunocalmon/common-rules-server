import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ChecksumEnvironment, ExtensionArtifact } from "./registry.js";
import { readExtensionRegistry, writeExtensionRegistry } from "./registry.js";
import { insertAnchor, computeChecksum } from "./anchor.js";

/**
 * Fonte de leitura/escrita do arquivo alvo, injetada — mesmo padrão das
 * demais fontes de resolução deste projeto.
 */
export interface TargetFileEnvironment {
  read(path: string): string;
  write(path: string, content: string): void;
}

const ROTEADOR_ARQUIVOS = new Set(["CLAUDE.md", "AGENTS.md"]);

/** Qual arquivo `target` resolve — a raiz para CLAUDE.md/AGENTS.md, um artefato próprio para o resto. */
export function resolveTargetPath(target: string): string {
  return ROTEADOR_ARQUIVOS.has(target) ? target : `.common-rules/extensions/${target}.md`;
}

export const EXTENSIONS_DIR = ".common-rules/extensions";

/** Ambiente real, usado pela linha de comando. Somente lê/escreve os caminhos resolvidos, nunca mais. */
export function realTargetFileEnvironment(root: string): TargetFileEnvironment {
  return {
    read: (path: string) => {
      const full = join(root, path);
      return existsSync(full) ? readFileSync(full, "utf8") : "";
    },
    write: (path: string, content: string) => {
      const full = join(root, path);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content);
    },
  };
}

/** Nomes dos arquivos presentes em `.common-rules/extensions/`, sem a extensão `.md` — usado pelo `doctor` para achar artefato sem registro (`AC-135`). */
export function listPresentExtensionNames(root: string): string[] {
  const dir = join(root, EXTENSIONS_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f: string) => f.endsWith(".md"))
    .map((f: string) => f.slice(0, -3));
}

export interface CreateOptions {
  category: "override" | "extension" | "new";
  name: string;
  target: string;
  content: string;
  registryEnv: ChecksumEnvironment;
  targetEnv: TargetFileEnvironment;
  /** Nomes dos sete hooks gerenciados. Ausente, resolve para `[]` — quem chama do `setup` real passa a lista real. */
  managedHooks?: string[];
  /**
   * Origem do instante gravado em `createdAt`. Ausente, usa `Date.now`
   * real — existe para não repetir o defeito que a `SPEC-0006` já corrigiu
   * (instante congelado ou não injetável em teste).
   */
  now?: () => string;
}

export interface CreateResult {
  ok: boolean;
  reason?: string;
  artifact?: ExtensionArtifact;
}

/**
 * Cria um artefato de extensão pelo único caminho de escrita — grava a
 * âncora no arquivo alvo e registra o checksum. Recusa `new` para um dos
 * sete hooks gerenciados (`FR-081`) e conflito de nome sem escolha padrão
 * (`FR-082`).
 */
export function createExtension(opts: CreateOptions): CreateResult {
  const managedHooks = opts.managedHooks ?? [];
  if (opts.category === "new" && managedHooks.includes(opts.target)) {
    return {
      ok: false,
      reason: `categoria new recusada: "${opts.target}" é um dos sete hooks gerenciados pelo setup; use override ou extension`,
    };
  }

  const registro = readExtensionRegistry(opts.registryEnv);
  const conflito = registro.artifacts.find((a) => a.name === opts.name);
  if (conflito) {
    return {
      ok: false,
      reason: `conflito de nome: "${opts.name}" já está registrado — escolha pular ou substituir explicitamente`,
    };
  }

  const path = resolveTargetPath(opts.target);
  const atual = opts.targetEnv.read(path);
  const atualizado = insertAnchor(atual, opts.category, opts.name, opts.content);
  opts.targetEnv.write(path, atualizado);

  const artifact: ExtensionArtifact = {
    category: opts.category,
    name: opts.name,
    target: opts.target,
    content: opts.content,
    checksum: computeChecksum(opts.content),
    createdAt: (opts.now ?? (() => new Date().toISOString()))(),
  };
  writeExtensionRegistry({ artifacts: [...registro.artifacts, artifact] }, opts.registryEnv);

  return { ok: true, artifact };
}
