import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Raiz do pacote, para localizar os recursos versionados — não a do projeto alvo. */
const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Recursos de fábrica de cada agente, versionados no pacote (`PR-001`). */
export const AGENT_RESOURCES_DIR = join(PACKAGE_ROOT, "resources", "agents");

/**
 * Escreve os arquivos de fábrica de um agente no projeto, quando ausentes.
 *
 * Nunca sobrescreve: o comportamento de um agente é justamente o que a pessoa
 * deve customizar, então um arquivo já presente pertence a ela (`DEC-004`).
 * Devolve os caminhos relativos que de fato escreveu, para o `setup` poder
 * relatar sem inspecionar o disco de novo.
 */
export function seedAgentDefaults(root: string, agent = "maestro"): string[] {
  const source = join(AGENT_RESOURCES_DIR, agent);
  if (!existsSync(source)) return [];

  const targetDir = join(root, ".maestro", "subagents", agent);
  const written: string[] = [];
  mkdirSync(targetDir, { recursive: true });

  for (const file of readdirSync(source)) {
    const target = join(targetDir, file);
    if (existsSync(target)) continue;
    copyFileSync(join(source, file), target);
    written.push(join(".maestro", "subagents", agent, file));
  }
  return written;
}
