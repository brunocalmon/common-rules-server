/** Returns `null` when the executable doesn't exist. */
export type Executor = (root: string) => { status: number; changed?: number; paths?: string[] } | null;

/**
 * Real argv, extracted so it can be reused by whoever needs to know the
 * command without running it — the approval plan from fatia 1i (`PR-062`).
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

const failure = (report: string): InstallResult => ({ changed: 0, paths: [], report, isError: true });

/**
 * Runs the Specsfy framework's project installer, via the official path.
 *
 * Doesn't persist its own record: `specsfy install` already keeps its
 * own state in `.specsfy/`, and duplicating that would create two truths
 * about the same framework (`DEC-030`). `setup` only reports what the
 * installer returned.
 */
export function installSpecsfy(opts: InstallOptions): InstallResult {
  const result = opts.execute(opts.root);
  if (result === null) {
    return failure("the Specsfy framework installer isn't available: nothing was installed");
  }
  if (result.status !== 0) {
    return failure(`the Specsfy framework installer exited with code ${result.status}: nothing was installed`);
  }
  const changed = result.changed ?? 0;
  const paths = result.paths ?? [];
  return {
    changed,
    paths,
    report: changed === 0 ? "specsfy was already up to date" : `specsfy updated: ${changed} file(s)`,
    isError: false,
  };
}
