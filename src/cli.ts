#!/usr/bin/env node
import { argv, exit, stderr, stdout } from "node:process";
import { fileURLToPath } from "node:url";
import { defaultEnvironment, inspectDependencies } from "./doctor.js";
import { readVersion } from "./version.js";

export interface CommandOutcome {
  output: string;
  exitCode: number;
}

/** Formata uma linha por dependência, com camada, origem e versão. */
function formatReport(): CommandOutcome {
  const report = inspectDependencies(defaultEnvironment());
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
export const COMMANDS: Record<string, () => CommandOutcome> = {
  version: () => ({ output: readVersion(), exitCode: 0 }),
  doctor: formatReport,
};

const ALIASES: Record<string, string> = {
  "--version": "version",
  "-v": "version",
  version: "version",
  doctor: "doctor",
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

// Só executa quando invocado como binário; importar o módulo não imprime nada,
// o que é o que permite a surface.test.ts inspecionar COMMANDS sem efeito.
if (argv[1] !== undefined && fileURLToPath(import.meta.url) === argv[1]) {
  const { output, exitCode } = run(argv.slice(2));
  (exitCode === 0 ? stdout : stderr).write(`${output}\n`);
  exit(exitCode);
}
