import type { BackendResult } from "../src/backends/detect";
import type { OllamaSnapshot } from "../src/models/ollama";

const GB = 1024 ** 3;

export const backends: BackendResult[] = [
  { name: "claude", present: true, supported: true, version: "1.0.0" } as BackendResult,
];

/** Grande de janela pequena vs menor de janela suficiente — o caso que o filtro precisa acertar. */
export const snapshot = (models: { name: string; sizeBytes: number }[]): OllamaSnapshot => ({ present: true, models });

export const BIG_SMALL_WINDOW = { name: "grande:14b", sizeBytes: 9 * GB };
export const SMALL_BIG_WINDOW = { name: "medio:8b", sizeBytes: 5 * GB };

export const windows: Record<string, number> = {
  "grande:14b": 8_192,
  "medio:8b": 131_072,
};

/** Leitor instrumentado: devolve a janela e registra cada consulta, para o custo ser verificável. */
export function countingReader(asked: string[]) {
  return (model: string): number | null => {
    asked.push(model);
    return windows[model] ?? null;
  };
}

export const capacity = { freeBytes: 12 * GB, totalBytes: 16 * GB } as const;
