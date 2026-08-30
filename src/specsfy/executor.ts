import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Executor } from "./install.js";

/** Raiz do pacote `common-rules`, não do projeto alvo. */
const packageRoot = (): string => resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Devolve o binário local do pacote `@promovaweb/specsfy`, ou nulo quando ausente. */
function resolveSpecsfyBin(root: string = packageRoot()): string | null {
  const bin = resolve(root, "node_modules", "@promovaweb", "specsfy", "bin", "specsfy.cjs");
  return existsSync(bin) ? bin : null;
}

interface SpecsfyJson {
  changed?: number;
  paths?: string[];
}

/**
 * Executor real do instalador de projeto do Specsfy, por subprocesso.
 *
 * Ao contrário do `skills`, a saída é JSON estável: `{"changed", "paths"}`.
 * Saída não parseável como JSON, ou status diferente de zero, é falha —
 * nunca sucesso silencioso.
 */
export function realSpecsfyExecutor(root: string = packageRoot()): Executor {
  const bin = resolveSpecsfyBin(root);
  return (raiz) => {
    if (bin === null) return null;
    const r = spawnSync(bin, ["install", "--project", raiz, "--json"], {
      cwd: raiz,
      encoding: "utf8",
      timeout: 120_000,
    });
    if (r.error) return null;
    const status = r.status ?? 1;
    if (status !== 0) return { status };
    try {
      const json = JSON.parse(r.stdout ?? "") as SpecsfyJson;
      return { status, changed: json.changed ?? 0, paths: json.paths ?? [] };
    } catch {
      return { status: 1 };
    }
  };
}
