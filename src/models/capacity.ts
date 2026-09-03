import { freemem, totalmem } from "node:os";

export interface Capacity {
  totalBytes: number;
  freeBytes: number;
}

/**
 * Resolution source, injected in the same pattern as `BackendEnvironment`
 * (fatia 1d) — the suite never depends on the free memory of the machine
 * it runs on.
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
