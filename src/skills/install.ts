import { resolveSource } from "./source.js";
import { inspectSkills } from "./inventory.js";
import type { SkillRecordEntry } from "./record.js";

/** Alvo único desta fatia; a fatia 1d é que abre os demais. */
export const TARGET_AGENT = "claude-code";

/** Devolve `null` quando o executável não existe. */
export type Executor = (args: string[], cwd: string) => { status: number; skills?: string[] } | null;

export interface InstallOptions {
  root: string;
  source: unknown;
  execute: Executor;
  previous?: SkillRecordEntry[] | null;
}

export interface InstallResult {
  installed: string[];
  report: string;
  isError: boolean;
  changed: boolean;
}

const erro = (report: string): InstallResult => ({ installed: [], report, isError: true, changed: false });

/**
 * Instala o conjunto na raiz informada, pelo caminho oficial.
 *
 * A forma global do instalador não é construída em lugar algum desta função,
 * de modo que a regra de não instalar fora do projeto não dependa da
 * disciplina de quem chama.
 */
export function installSkills(opts: InstallOptions): InstallResult {
  const origem = resolveSource(opts.source);
  if (!origem.ok) return erro(origem.reason);

  const base = [origem.source, "-a", TARGET_AGENT, "--skill", "*", "--copy", "-y"];

  // Enumerar antes de escrever é o que permite recusar conflito sem já ter
  // sobrescrito. Descobrir depois seria descobrir tarde demais.
  const listagem = opts.execute(["add", ...base, "--list"], opts.root);
  if (listagem === null) {
    return erro(`o instalador oficial não está disponível: nenhum conjunto foi instalado a partir de ${origem.source}`);
  }
  if (listagem.status !== 0) {
    return erro(`o instalador terminou com código ${listagem.status} ao enumerar: nenhum conjunto foi instalado`);
  }

  const candidatos = listagem.skills ?? [];
  const presentes = new Set(inspectSkills(opts.root).dirs);
  const anteriores = new Set((opts.previous ?? []).map((e) => e.name));
  const conflitos = candidatos.filter((n) => presentes.has(n) && !anteriores.has(n));
  if (conflitos.length > 0) {
    return erro(`conflito de nome com conteúdo já presente: ${conflitos.join(", ")}. Nada foi escrito`);
  }

  const jaFeito = candidatos.length > 0 && candidatos.every((n) => anteriores.has(n));

  const execucao = opts.execute(["add", ...base], opts.root);
  if (execucao === null) {
    return erro(`o instalador oficial não está disponível: nenhum conjunto foi instalado a partir de ${origem.source}`);
  }
  if (execucao.status !== 0) {
    return erro(`o instalador terminou com código ${execucao.status}: o conjunto não ficou instalado`);
  }

  return {
    installed: candidatos,
    report: jaFeito
      ? `já estava configurado: ${candidatos.length} skills inalteradas a partir de ${origem.source}`
      : `${candidatos.length} skills copiadas a partir de ${origem.source}`,
    isError: false,
    changed: !jaFeito,
  };
}
