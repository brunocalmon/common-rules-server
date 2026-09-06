import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { packageRoot, VENV_DIR, PYTHON_SUBSYSTEM, type BridgeEnvironment } from "./bridge.js";
import type { DependencyResolution } from "../hooks/resolve.js";

/** Where `context-mode`'s own npm dependency ends up, once `maestro` itself is installed. */
const CONTEXT_MODE = "context-mode";

/**
 * Resolves both dependency hooks embed a command for, to an absolute path
 * whenever one is knowable — never by guessing, only from what `setup`
 * itself already knows about its own installation.
 *
 * `context-mode` is a hard npm dependency of `maestro`: whatever
 * installed `maestro` already installed it, so its `node_modules/.bin`
 * entry exists unconditionally, unlike `code-review-graph` which is
 * bridged lazily, on demand, only when neither a local nor a global copy
 * exists (`bridge.ts`).
 *
 * `codeReviewGraphLocal` is passed in rather than re-probed here, because
 * the caller already knows both the current state (`bridgeEnv.localVenv`)
 * and whether this very call is about to create one (`bridgePending` in
 * `run.ts`) — this function only turns that knowledge into a path.
 */
export function buildDependencyResolution(opts: {
  root?: string;
  codeReviewGraphLocal: boolean;
}): DependencyResolution {
  const root = opts.root ?? packageRoot();
  const contextModeBin = resolve(root, "node_modules", ".bin", CONTEXT_MODE);
  const codeReviewGraphBin = resolve(root, VENV_DIR, "bin", PYTHON_SUBSYSTEM);

  return {
    [CONTEXT_MODE]: existsSync(contextModeBin) ? contextModeBin : null,
    [PYTHON_SUBSYSTEM]: opts.codeReviewGraphLocal ? codeReviewGraphBin : null,
  };
}

/** Whether a local `code-review-graph` copy already exists or is about to be created this run. */
export function codeReviewGraphWillBeLocal(env: BridgeEnvironment | undefined, bridgePending: boolean): boolean {
  return Boolean(env && (env.localVenv !== null || bridgePending));
}
