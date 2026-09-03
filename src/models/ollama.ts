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
 * Resolution source, injected in the same pattern as `BackendEnvironment`
 * (fatia 1d) — the suite never depends on the `ollama` of whoever runs it.
 */
export interface OllamaEnvironment {
  present(): boolean;
  list(): string;
}

const UNITS: Record<string, number> = {
  B: 1,
  KB: 1_000,
  MB: 1_000_000,
  GB: 1_000_000_000,
  TB: 1_000_000_000_000,
};

function sizeToBytes(column: string): number {
  const m = column.trim().match(/^([\d.]+)\s*([KMGT]?B)$/i);
  if (!m || m[1] === undefined || m[2] === undefined) return 0;
  const value = parseFloat(m[1]);
  return Math.round(value * (UNITS[m[2].toUpperCase()] ?? 1));
}

/** `ollama list` prints a header followed by one line per model, columns separated by 2+ spaces. */
function parseOllamaList(output: string): OllamaModel[] {
  return output
    .split("\n")
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const columns = line.split(/\s{2,}/);
      return { name: columns[0] ?? "", sizeBytes: sizeToBytes(columns[2] ?? "") };
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
