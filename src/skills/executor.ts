import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Executor } from "./install.js";
import { buildSkillsAddArgs } from "./install.js";

/** Raiz do pacote `common-rules`, não do projeto alvo. */
const packageRoot = (): string => resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Devolve o binário local do pacote `skills`, ou nulo quando ausente. */
export function resolveSkillsBin(root: string = packageRoot()): string | null {
  const bin = resolve(root, "node_modules", "skills", "bin", "cli.mjs");
  return existsSync(bin) ? bin : null;
}

/**
 * Reconhece nome de skill numa linha da listagem do `--list`.
 *
 * A CLI real não tem saída `--json` para essa enumeração: é texto formatado
 * para terminal, com código ANSI. O nome de cada skill vive numa linha
 * própria, quatro espaços depois de `│`; a descrição, na linha seguinte, vive
 * seis espaços depois — a diferença de indentação é o que distingue as duas.
 */
function parseSkillNames(stdout: string): string[] {
  const semAnsi = stdout.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, "");
  const linha = /^│ {4}([a-z0-9][\w.-]*)\s*$/gm;
  const nomes: string[] = [];
  for (const m of semAnsi.matchAll(linha)) nomes.push(m[1]!);
  return nomes;
}

/**
 * Executor real do instalador `skills`, por subprocesso.
 *
 * Sem `--list`, devolve só o código de saída. Com `--list`, uma execução que
 * termina em zero mas não reconhece skill nenhuma é tratada como falha — o
 * mesmo princípio de `AC-028`: nunca relatar zero skills instaladas como
 * sucesso, mesmo quando é o parsing que falhou e não o instalador.
 */
export function realSkillsExecutor(root: string = packageRoot()): Executor {
  const bin = resolveSkillsBin(root);
  return (args, cwd) => {
    if (bin === null) return null;
    const r = spawnSync(bin, args, { cwd, encoding: "utf8", timeout: 120_000 });
    if (r.error) return null;
    const status = r.status ?? 1;
    if (!args.includes("--list")) return { status };
    const skills = parseSkillNames(r.stdout ?? "");
    if (status === 0 && skills.length === 0) return { status: 1 };
    return { status, skills };
  };
}

/**
 * O comando que `realSkillsExecutor` de fato dispararia para `source`, sem
 * executar nada — para o plano de aprovação (fatia 1i, `PR-062`). `null`
 * quando o binário não existe, mesma convenção de `Executor`.
 */
export function describeSkillsCommand(source: string, root: string = packageRoot()): { bin: string; args: string[] } | null {
  const bin = resolveSkillsBin(root);
  if (bin === null) return null;
  return { bin, args: buildSkillsAddArgs(source) };
}
