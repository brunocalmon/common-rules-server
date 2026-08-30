import type { BackendResult } from "../src/backends/detect";
import type { OllamaModel } from "../src/models/ollama";
import type { Capacity } from "../src/models/capacity";

/** Constrói backends fake a partir de nomes presentes; os demais suportados ficam ausentes. */
export function backendsFake(presentes: string[], suportados = ["pi", "agy", "claude", "codex", "goose"]): BackendResult[] {
  const todos = new Set([...suportados, ...presentes]);
  return [...todos].map((name) => ({
    name,
    present: presentes.includes(name),
    version: presentes.includes(name) ? "0.0.0" : null,
    supported: suportados.includes(name),
  }));
}

export function modeloFake(name: string, sizeGB: number): OllamaModel {
  return { name, sizeBytes: sizeGB * 1_000_000_000 };
}

/** `ollama` ausente: nenhuma fonte de modelo local disponível. */
export const ollamaAusente = { present: false, models: [] as OllamaModel[] };

/** `ollama` presente, com os modelos informados (lista vazia é válida: ollama presente, nada baixado). */
export function ollamaPresente(modelos: OllamaModel[]): { present: true; models: OllamaModel[] } {
  return { present: true, models: modelos };
}

export function capacidadeFake(freeGB: number, totalGB = freeGB): Capacity {
  return { freeBytes: freeGB * 1_000_000_000, totalBytes: totalGB * 1_000_000_000 };
}
