import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { inspectSkills } from "./inventory.js";

/** Lockfile que o próprio instalador grava, na raiz do projeto. */
export const LOCK_PATH = "skills-lock.json";

export interface LockEntry {
  source: string;
  sourceType: string;
  skillPath: string;
  computedHash: string;
}

export interface SkillRecordEntry extends LockEntry {
  name: string;
}

export interface SkillReportRow {
  name: string;
  origin: string;
  present: boolean;
  diverged: boolean;
}

export interface SkillReport {
  results: SkillReportRow[];
  exitCode: number;
  note: string;
}

/**
 * Declaração do alcance real da garantia.
 *
 * O lockfile registra o que se obteve, e não o que se deve obter: não há
 * referência de commit nem versão do conjunto. Dizer isso no relato evita que
 * a ferramenta prometa mais do que entrega.
 */
export const GUARANTEE_NOTE =
  "A origem registrada não fixa a referência obtida: o instalador busca a ponta a cada execução, " +
  "e este relato existe para tornar a deriva visível.";

/** Lê o lockfile do instalador. Devolve nulo quando ele não existe. */
export function readLock(root: string): Record<string, LockEntry> | null {
  const caminho = join(root, LOCK_PATH);
  if (!existsSync(caminho)) return null;
  const bruto = JSON.parse(readFileSync(caminho, "utf8")) as { skills?: Record<string, LockEntry> };
  const skills = bruto.skills ?? {};
  return Object.keys(skills).length > 0 ? skills : null;
}

/**
 * Converte o lockfile em entradas do registro do projeto.
 *
 * A procedência é lida, nunca recalculada: o instalador já computa um hash por
 * skill, e recalcular criaria duas verdades sobre o mesmo conteúdo.
 */
export function toRecordEntries(lock: Record<string, LockEntry> | null): SkillRecordEntry[] {
  if (!lock) return [];
  return Object.entries(lock).map(([name, e]) => ({ name, ...e }));
}

/**
 * Compara o registrado com o presente, sem alterar coisa alguma.
 *
 * É a função que o `doctor` consome, e por isso não escreve: diagnosticar e
 * reparar são comandos distintos, e reparo destrutivo está fora de escopo.
 */
export function reportSkills(root: string): SkillReport {
  const entradas = toRecordEntries(readLock(root));
  const presentes = new Set(inspectSkills(root).dirs);
  const results = entradas.map((e) => {
    const present = presentes.has(e.name);
    return { name: e.name, origin: e.source, present, diverged: !present };
  });
  return {
    results,
    exitCode: results.some((r) => r.diverged) ? 1 : 0,
    note: GUARANTEE_NOTE,
  };
}
