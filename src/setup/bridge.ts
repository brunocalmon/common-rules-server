import { execFileSync } from "node:child_process";

/** Versão fixada do subsistema Python, verificada contra o PyPI em 2026-08-24. */
export const PYTHON_SUBSYSTEM = "code-review-graph";
export const PINNED_VERSION = "2.3.7";

/** Diretório do ambiente virtual, sempre dentro do projeto. */
export const VENV_DIR = ".venv-crg";

export interface BridgeEnvironment {
  /** Versão da cópia local do projeto, ou null. */
  localVenv: string | null;
  /** Versão alcançável pelo PATH, ou null. */
  onPath: string | null;
  /** Se `uv` está disponível para criar a cópia. */
  hasUv: boolean;
}

export interface BridgeResult {
  /** Especificador que seria instalado, ou null quando não há o que fazer. */
  wouldInstall: string | null;
  /** Diretório de destino, relativo ao projeto. */
  targetDir: string;
  /** Sempre falso: esta ferramenta não escreve no ambiente global. */
  touchesGlobal: boolean;
  /** Motivo da recusa, quando houver. */
  refused: string | null;
  /** Se a instalação chegou a ser executada. */
  executed: boolean;
}

/**
 * Cria a cópia local do subsistema Python quando ela falta nas duas origens.
 *
 * Nunca escreve no ambiente global. `uv tool install` gravaria em
 * `~/.local/share/uv/tools/`, fora do projeto, e o ambiente da máquina é gerido
 * por um playbook declarativo cuja regra é que nada se instala manualmente.
 * Esta ponte usa ambiente virtual do projeto, que custa cerca de 262 MB e por
 * isso é criado sob pedido, e não a cada instalação.
 */
export function bridgePythonSubsystem(opts: {
  env: BridgeEnvironment;
  execute: boolean;
}): BridgeResult {
  const base: BridgeResult = {
    wouldInstall: null,
    targetDir: VENV_DIR,
    touchesGlobal: false,
    refused: null,
    executed: false,
  };

  // A cópia local tem precedência: existindo, não há o que fazer.
  if (opts.env.localVenv !== null) return base;

  // A global serve para usar, mas não dispensa a ponte quando alguém a pede;
  // quem decide é o chamador. Aqui, having-on-PATH também não exige ação.
  if (opts.env.onPath !== null) return base;

  if (!opts.env.hasUv) {
    return { ...base, refused: `${PYTHON_SUBSYSTEM} ausente e uv não está disponível para criar a cópia local` };
  }

  const spec = `${PYTHON_SUBSYSTEM}==${PINNED_VERSION}`;
  if (!opts.execute) return { ...base, wouldInstall: spec };

  execFileSync("uv", ["venv", VENV_DIR], { stdio: "inherit" });
  execFileSync("uv", ["pip", "install", "--python", VENV_DIR, spec], { stdio: "inherit" });
  return { ...base, wouldInstall: spec, executed: true };
}
