import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Camada a que a dependência pertence. `agent`, da fatia 1d, é informativa — nunca afeta `exitCode`. */
export type Layer = "npm" | "python" | "agent";

/** Origem que resolveu a dependência. Local sempre tem precedência sobre global. */
export type Origin = "local" | "global";

export interface DependencyResult {
  name: string;
  layer: Layer;
  present: boolean;
  origin: Origin | null;
  version: string | null;
  hint?: string;
  /** Só para `layer: "agent"`: capacidade de invocação sem interação demonstrada (SPEC-0008). */
  supported?: boolean;
}

import { reportSkills, type SkillReportRow } from "./skills/record.js";
import { readTrace, type TraceRead } from "./telemetry/read.js";
import { detectBackends, realBackendEnvironment, type BackendEnvironment } from "./backends/detect.js";

export interface Report {
  results: DependencyResult[];
  exitCode: number;
  /** Conjuntos de skills registrados, quando uma raiz é informada. */
  skills?: SkillReportRow[];
  /** Declaração do alcance da garantia sobre os conjuntos. */
  note?: string;
  /** Identificador da última execução registrada, quando uma raiz é informada. */
  trace?: TraceRead;
}

/**
 * Fontes de resolução, injetadas para que a verificação seja testável.
 *
 * Sem injeção, um teste consultaria o PATH real e provaria apenas em que
 * máquina rodou.
 */
export interface Environment {
  /** Versão do pacote npm em node_modules do projeto, ou null. */
  resolveNpm(name: string): string | null;
  /** Versão do pacote npm instalado globalmente, ou null. */
  resolveGlobalNpm?(name: string): string | null;
  /** Versão do subsistema Python no ambiente virtual do projeto, ou null. */
  resolveLocalPython(): string | null;
  /** Versão do subsistema Python alcançável pelo PATH, ou null. */
  resolveOnPath(): string | null;
}

export const NPM_SUBSYSTEMS = ["@promovaweb/specsfy", "context-mode"] as const;
export const PYTHON_SUBSYSTEM = "code-review-graph";

const NPM_HINT =
  "declarado em dependencies; resolva-o localmente com uma instalação do projeto, sem instalar globalmente";
const PYTHON_HINT =
  `${PYTHON_SUBSYSTEM} é ferramenta Python instalada por uv, e não um pacote npm; ` +
  "crie a cópia local do projeto pela ponte explícita do setup, ou deixe-a disponível no PATH";

/** Aplica a regra de resolução: preferir a local, aceitar a global. */
function pick(local: string | null, global: string | null): { origin: Origin | null; version: string | null } {
  if (local !== null) return { origin: "local", version: local };
  if (global !== null) return { origin: "global", version: global };
  return { origin: null, version: null };
}

/**
 * Verifica as três dependências do projeto e relata origem e versão de cada uma.
 *
 * Não instala nada, em nenhuma origem: instalar pertence ao setup, e o ambiente
 * de destino é gerido por um playbook declarativo.
 */
export function inspectDependencies(
  env: Environment,
  root?: string,
  backendEnv: BackendEnvironment = realBackendEnvironment(),
): Report {
  const results: DependencyResult[] = [];

  for (const name of NPM_SUBSYSTEMS) {
    const { origin, version } = pick(env.resolveNpm(name), env.resolveGlobalNpm?.(name) ?? null);
    const present = origin !== null;
    results.push({ name, layer: "npm", present, origin, version, ...(present ? {} : { hint: NPM_HINT }) });
  }

  const { origin, version } = pick(env.resolveLocalPython(), env.resolveOnPath());
  const present = origin !== null;
  results.push({
    name: PYTHON_SUBSYSTEM,
    layer: "python",
    present,
    origin,
    version,
    ...(present ? {} : { hint: PYTHON_HINT }),
  });

  // Camada informativa: backend de agente nunca instalado por este projeto
  // (PR-031), então ausência nunca entra em `dependenciasOk` (PR-032).
  for (const backend of detectBackends(backendEnv)) {
    results.push({
      name: backend.name,
      layer: "agent",
      present: backend.present,
      origin: backend.present ? "global" : null,
      version: backend.version,
      supported: backend.supported,
    });
  }

  const dependenciasOk = results.filter((r) => r.layer !== "agent").every((r) => r.present);
  if (root === undefined) return { results, exitCode: dependenciasOk ? 0 : 1 };

  // Somente leitura: o `doctor` relata a deriva e não a repara. Reparo
  // destrutivo permanece fora de escopo.
  const conjuntos = reportSkills(root);
  return {
    results,
    skills: conjuntos.results,
    note: conjuntos.note,
    trace: readTrace(root),
    exitCode: dependenciasOk && conjuntos.exitCode === 0 ? 0 : 1,
  };
}

const projectRoot = (): string => resolve(dirname(fileURLToPath(import.meta.url)), "..");

const readInstalledVersion = (manifestPath: string): string | null => {
  if (!existsSync(manifestPath)) return null;
  const version: unknown = (JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>)["version"];
  return typeof version === "string" ? version : null;
};

const probe = (command: string, args: string[]): string | null => {
  try {
    const out = execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return out.trim().split(/\s+/).pop() ?? null;
  } catch {
    return null;
  }
};

/** Ambiente real, usado pela linha de comando. Somente lê; nunca instala. */
export function defaultEnvironment(root: string = projectRoot()): Environment {
  return {
    resolveNpm: (name) => readInstalledVersion(resolve(root, "node_modules", name, "package.json")),
    resolveLocalPython: () => {
      const bin = resolve(root, ".venv-crg", "bin", PYTHON_SUBSYSTEM);
      return existsSync(bin) ? probe(bin, ["--version"]) : null;
    },
    resolveOnPath: () => probe(PYTHON_SUBSYSTEM, ["--version"]),
  };
}
