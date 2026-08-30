import { freemem, totalmem } from "node:os";

export interface Capacity {
  totalBytes: number;
  freeBytes: number;
}

/**
 * Fonte de resolução, injetada no mesmo padrão de `BackendEnvironment`
 * (fatia 1d) — a suíte nunca depende da memória livre da máquina onde roda.
 */
export interface CapacityEnvironment {
  totalBytes(): number;
  freeBytes(): number;
}

export function realCapacityEnvironment(): CapacityEnvironment {
  return { totalBytes: () => totalmem(), freeBytes: () => freemem() };
}

export function readCapacity(env: CapacityEnvironment = realCapacityEnvironment()): Capacity {
  return { totalBytes: env.totalBytes(), freeBytes: env.freeBytes() };
}
