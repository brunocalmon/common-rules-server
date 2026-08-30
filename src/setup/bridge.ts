import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Versão fixada do subsistema Python, verificada contra o PyPI em 2026-08-24. */
export const PYTHON_SUBSYSTEM = "code-review-graph";
export const PINNED_VERSION = "2.3.7";

/** Diretório do ambiente virtual, sempre dentro do projeto. */
export const VENV_DIR = ".venv-crg";

/**
 * Raiz do pacote `common-rules`, não do projeto alvo — mesma distinção que
 * `packageRoot()` já faz em `src/skills/executor.ts`/`src/specsfy/executor.ts`.
 * `doctor.ts`'s `defaultEnvironment()` já procura `.venv-crg` aqui, e não na
 * raiz do projeto alvo: os dois precisam concordar sobre onde a cópia local
 * vive, ou `doctor` continuaria relatando ausência depois de uma instalação
 * real bem-sucedida.
 */
const packageRoot = (): string => resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const probe = (command: string, args: string[]): string | null => {
  try {
    const out = execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return out.trim().split(/\s+/).pop() ?? null;
  } catch {
    return null;
  }
};

const commandExists = (name: string): boolean => {
  try {
    execFileSync("which", [name], { stdio: ["ignore", "ignore", "ignore"] });
    return true;
  } catch {
    return false;
  }
};

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
  /** Onde `.venv-crg/` é criado. Ausente, usa a raiz do pacote `common-rules` — o mesmo local que `doctor.ts` já verifica. */
  cwd?: string;
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

  const cwd = opts.cwd ?? packageRoot();
  try {
    execFileSync("uv", ["venv", VENV_DIR], { cwd, stdio: "inherit" });
    execFileSync("uv", ["pip", "install", "--python", VENV_DIR, spec], { cwd, stdio: "inherit" });
    return { ...base, wouldInstall: spec, executed: true };
  } catch (error) {
    // `uv venv` não depende de rede e já pode ter criado o diretório antes de
    // `uv pip install` falhar (ex.: PyPI inacessível) — reportado como falha
    // da ponte, nunca propagado como exceção não tratada.
    const motivo = error instanceof Error ? error.message : String(error);
    return { ...base, wouldInstall: spec, executed: false, refused: `instalação falhou: ${motivo}` };
  }
}

/**
 * Ambiente real, usado pela linha de comando. Somente lê antes de decidir;
 * a escrita real fica inteiramente em `bridgePythonSubsystem`.
 */
export function realBridgeEnvironment(root: string = packageRoot()): BridgeEnvironment {
  return {
    localVenv: (() => {
      const bin = resolve(root, VENV_DIR, "bin", PYTHON_SUBSYSTEM);
      return existsSync(bin) ? probe(bin, ["--version"]) : null;
    })(),
    onPath: probe(PYTHON_SUBSYSTEM, ["--version"]),
    hasUv: commandExists("uv"),
  };
}
