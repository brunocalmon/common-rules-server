import { execFileSync } from "node:child_process";

export interface OllamaModel {
  name: string;
  sizeBytes: number;
}

export interface OllamaSnapshot {
  present: boolean;
  models: OllamaModel[];
}

/**
 * Fonte de resolução, injetada no mesmo padrão de `BackendEnvironment`
 * (fatia 1d) — a suíte nunca depende do `ollama` de quem a executa.
 */
export interface OllamaEnvironment {
  present(): boolean;
  list(): string;
}

const UNIDADES: Record<string, number> = {
  B: 1,
  KB: 1_000,
  MB: 1_000_000,
  GB: 1_000_000_000,
  TB: 1_000_000_000_000,
};

function tamanhoParaBytes(coluna: string): number {
  const m = coluna.trim().match(/^([\d.]+)\s*([KMGT]?B)$/i);
  if (!m || m[1] === undefined || m[2] === undefined) return 0;
  const valor = parseFloat(m[1]);
  return Math.round(valor * (UNIDADES[m[2].toUpperCase()] ?? 1));
}

/** `ollama list` imprime um cabeçalho seguido de uma linha por modelo, colunas separadas por 2+ espaços. */
function parseOllamaList(saida: string): OllamaModel[] {
  return saida
    .split("\n")
    .slice(1)
    .map((linha) => linha.trim())
    .filter((linha) => linha.length > 0)
    .map((linha) => {
      const colunas = linha.split(/\s{2,}/);
      return { name: colunas[0] ?? "", sizeBytes: tamanhoParaBytes(colunas[2] ?? "") };
    });
}

const commandExists = (name: string): boolean => {
  try {
    execFileSync("which", [name], { stdio: ["ignore", "ignore", "ignore"] });
    return true;
  } catch {
    return false;
  }
};

export function realOllamaEnvironment(): OllamaEnvironment {
  return {
    present: () => commandExists("ollama"),
    list(): string {
      try {
        return execFileSync("ollama", ["list"], { encoding: "utf8" });
      } catch {
        return "";
      }
    },
  };
}

export function listOllamaModels(env: OllamaEnvironment = realOllamaEnvironment()): OllamaSnapshot {
  if (!env.present()) return { present: false, models: [] };
  return { present: true, models: parseOllamaList(env.list()) };
}
