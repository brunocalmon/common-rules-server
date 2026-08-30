#!/usr/bin/env node
import { argv, exit, stderr, stdout } from "node:process";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";
import { defaultEnvironment, inspectDependencies } from "./doctor.js";
import { runSetup, TARGET_SETTINGS } from "./setup/run.js";
import { detectEnvironment } from "./setup/env.js";
import { readRecordFile } from "./setup/write.js";
import { RECORD_PATH } from "./setup/record.js";
import { readVersion } from "./version.js";

export interface CommandOutcome {
  output: string;
  exitCode: number;
}

/** Formata uma linha por dependência, com camada, origem e versão. */
function formatReport(): CommandOutcome {
  const report = inspectDependencies(defaultEnvironment(), process.cwd());
  const lines = report.results.map((d) => {
    const head = `${d.present ? "ok     " : "ausente"} ${d.name}`;
    if (!d.present) return `${head}\n        ${d.hint ?? ""}`.trimEnd();
    return `${head} — camada ${d.layer}, origem ${d.origin}, versão ${d.version}`;
  });
  return { output: lines.join("\n"), exitCode: report.exitCode };
}

/**
 * Superfície completa do esqueleto.
 *
 * Dois comandos, e nada além disso: setup, orquestração, aprovação e seleção de
 * modelo pertencem às fatias seguintes. `surface.test.ts` reprova se algum
 * deles vazar para cá antes da hora.
 */
/** Formata o resultado do setup, sem decidir nada sobre ele. */
function formatSetup(): CommandOutcome {
  // Ler o registro anterior é o que faz a idempotência valer na prática: sem
  // isto o comando reinstala e relata instalação a cada execução, ainda que o
  // resultado em disco seja o mesmo.
  const root = process.cwd();
  const previous = readRecordFile(root, RECORD_PATH);
  const r = runSetup({ env: detectEnvironment(root), root, write: true, previous });
  if (r.installed.length === 0) return { output: r.report, exitCode: r.exitCode };
  const linhas = r.installed.map((h) => `  ${h.name} — evento ${h.event}, em ${TARGET_SETTINGS}`);
  return { output: [r.report, ...linhas].join("\n"), exitCode: r.exitCode };
}

export const COMMANDS: Record<string, () => CommandOutcome> = {
  version: () => ({ output: readVersion(), exitCode: 0 }),
  doctor: formatReport,
  setup: formatSetup,
};

const ALIASES: Record<string, string> = {
  "--version": "version",
  "-v": "version",
  version: "version",
  doctor: "doctor",
  setup: "setup",
};

/** Resolve o argumento recebido para um comando conhecido, ou null. */
export function resolveCommand(args: readonly string[]): string | null {
  const first = args[0];
  if (first === undefined) return null;
  return ALIASES[first] ?? null;
}

export function run(args: readonly string[]): CommandOutcome {
  const name = resolveCommand(args);
  if (name === null) {
    const conhecidos = Object.keys(COMMANDS).join(", ");
    return { output: `comando não reconhecido. Disponíveis: ${conhecidos}`, exitCode: 2 };
  }
  const command = COMMANDS[name];
  if (command === undefined) return { output: `comando ${name} sem implementação`, exitCode: 2 };
  return command();
}

/**
 * Resolve `argv[1]` pelo caminho real antes de comparar.
 *
 * Toda instalação global do npm — `npm link` ou `npm install -g` de pacote
 * publicado — entrega o binário como link simbólico. `argv[1]` preserva o
 * caminho do link, e `fileURLToPath(import.meta.url)` é sempre o caminho
 * real; comparar os dois direto nunca bate fora deste checkout. Devolve
 * `undefined` em vez de lançar quando o caminho não existe, para que o guard
 * simplesmente não dispare em vez de derrubar o processo.
 */
function realEntryPath(caminho: string | undefined): string | undefined {
  if (caminho === undefined) return undefined;
  try {
    return realpathSync(caminho);
  } catch {
    return undefined;
  }
}

// Só executa quando invocado como binário; importar o módulo não imprime nada,
// o que é o que permite a surface.test.ts inspecionar COMMANDS sem efeito.
if (fileURLToPath(import.meta.url) === realEntryPath(argv[1])) {
  const { output, exitCode } = run(argv.slice(2));
  (exitCode === 0 ? stdout : stderr).write(`${output}\n`);
  exit(exitCode);
}
