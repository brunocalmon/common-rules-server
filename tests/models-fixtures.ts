import type { BackendResult } from "../src/backends/detect";
import type { OllamaModel } from "../src/models/ollama";
import type { Capacity } from "../src/models/capacity";

/** Builds fake backends from present names; the other supported ones stay absent. */
export function backendsFake(present: string[], supported = ["pi", "agy", "claude", "codex", "goose"]): BackendResult[] {
  const all = new Set([...supported, ...present]);
  return [...all].map((name) => ({
    name,
    present: present.includes(name),
    version: present.includes(name) ? "0.0.0" : null,
    supported: supported.includes(name),
  }));
}

export function modelFake(name: string, sizeGB: number): OllamaModel {
  return { name, sizeBytes: sizeGB * 1_000_000_000 };
}

/** `ollama` absent: no local model source available. */
export const ollamaAbsent = { present: false, models: [] as OllamaModel[] };

/** `ollama` present, with the given models (an empty list is valid: ollama present, nothing downloaded). */
export function ollamaPresent(models: OllamaModel[]): { present: true; models: OllamaModel[] } {
  return { present: true, models };
}

export function capacityFake(freeGB: number, totalGB = freeGB): Capacity {
  return { freeBytes: freeGB * 1_000_000_000, totalBytes: totalGB * 1_000_000_000 };
}
