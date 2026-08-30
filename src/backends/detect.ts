import { execFileSync } from "node:child_process";
import { KNOWN_AGENT_BACKENDS, SUPPORTED_AGENT_BACKENDS } from "./known.js";

/**
 * Fonte de resolução, injetada para que a suíte não dependa do que está
 * instalado na máquina de quem a executa — mesmo padrão do `Environment` de
 * `doctor` e do `TargetEnvironment` da fatia 1a.
 */
export interface BackendEnvironment {
  /** Presença no `PATH`, independente de `--version` responder. */
  resolvePresence(name: string): boolean;
  /** Versão relatada por `--version`, ou `null` quando não interpretável. */
  resolveVersion(name: string): string | null;
}

export interface BackendResult {
  name: string;
  present: boolean;
  version: string | null;
  supported: boolean;
}

const commandExists = (name: string): boolean => {
  try {
    execFileSync("which", [name], { stdio: ["ignore", "ignore", "ignore"] });
    return true;
  } catch {
    return false;
  }
};

/**
 * Extrai a versão da saída de `--version`.
 *
 * O último token, que basta para `code-review-graph` em `doctor.ts`, quebra
 * aqui: `claude --version` devolve `2.1.251 (Claude Code)`, cujo último token
 * é `Code)`. Preferir o primeiro token que começa com dígito resolve
 * `claude` e `codex-cli 0.151.0` ao mesmo tempo, caindo no último token só
 * quando nenhum começa com dígito.
 */
const probeVersion = (name: string): string | null => {
  try {
    const out = execFileSync(name, ["--version"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const tokens = out.trim().split(/\s+/);
    return tokens.find((t) => /^\d/.test(t)) ?? tokens.pop() ?? null;
  } catch {
    return null;
  }
};

/** Ambiente real. Presença via `which`, versão via `--version` — nunca `--help`. */
export function realBackendEnvironment(): BackendEnvironment {
  return { resolvePresence: commandExists, resolveVersion: probeVersion };
}

/**
 * Detecta cada backend candidato conhecido, sem invocar além do necessário
 * para presença e versão.
 *
 * Presença não depende de `--version` responder: um backend presente cujo
 * `--version` falha ou não devolve saída interpretável continua presente,
 * com versão desconhecida — a mesma distinção entre "capaz" e "pronto para
 * responder" que a pesquisa desta fatia observou em `goose run` sem
 * credencial configurada.
 */
export function detectBackends(
  env: BackendEnvironment,
  known: readonly string[] = KNOWN_AGENT_BACKENDS,
  supported: readonly string[] = SUPPORTED_AGENT_BACKENDS,
): BackendResult[] {
  return known.map((name) => {
    const present = env.resolvePresence(name);
    const version = present ? env.resolveVersion(name) : null;
    return { name, present, version, supported: supported.includes(name) };
  });
}
