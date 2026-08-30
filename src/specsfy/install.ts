/** Devolve `null` quando o executável não existe. */
export type Executor = (root: string) => { status: number; changed?: number; paths?: string[] } | null;

/**
 * Argv real, extraída para ser reaproveitada por quem precisa conhecer o
 * comando sem executá-lo — o plano de aprovação da fatia 1i (`PR-062`).
 */
export function buildSpecsfyInstallArgs(root: string): string[] {
  return ["install", "--project", root, "--json"];
}

export interface InstallOptions {
  root: string;
  execute: Executor;
}

export interface InstallResult {
  changed: number;
  paths: string[];
  report: string;
  isError: boolean;
}

const erro = (report: string): InstallResult => ({ changed: 0, paths: [], report, isError: true });

/**
 * Executa o instalador de projeto do framework Specsfy, pelo caminho oficial.
 *
 * Não persiste registro próprio: `specsfy install` já mantém seu próprio
 * estado em `.specsfy/`, e duplicar isso criaria duas verdades sobre o mesmo
 * framework (`DEC-030`). O `setup` só relata o que o instalador devolveu.
 */
export function installSpecsfy(opts: InstallOptions): InstallResult {
  const resultado = opts.execute(opts.root);
  if (resultado === null) {
    return erro("o instalador do framework Specsfy não está disponível: nada foi instalado");
  }
  if (resultado.status !== 0) {
    return erro(`o instalador do framework Specsfy terminou com código ${resultado.status}: nada foi instalado`);
  }
  const changed = resultado.changed ?? 0;
  const paths = resultado.paths ?? [];
  return {
    changed,
    paths,
    report: changed === 0 ? "specsfy já estava atualizado" : `specsfy atualizado: ${changed} arquivo(s)`,
    isError: false,
  };
}
