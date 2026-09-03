import { randomBytes } from "node:crypto";

/** Fixed identifier length, in hex characters. */
export const TRACE_ID_LENGTH = 32;

/**
 * Source of this tool's non-determinism.
 *
 * The single source of instant and identifier, replaceable in one place.
 * Fatia 1b tried the opposite path — freezing the instant at `new Date(0)`
 * to give test cases predictability — and the result was a record that
 * claimed, on every machine, that installation happened in 1970.
 * Determinism is bought by injecting the source, not by faking the value.
 */
export interface TraceSource {
  /** Current instant, in ISO 8601. */
  now(): string;
  /** Run identifier. */
  id(): string;
}

/**
 * Produces an opaque identifier.
 *
 * Derived from random bytes, not from environment data, so opacity is a
 * property of the construction rather than the result of filtering: there's
 * no person name, machine name, or path to remove, because none goes in.
 */
export function generateId(): string {
  return randomBytes(TRACE_ID_LENGTH / 2).toString("hex");
}

/** Current system clock instant, in ISO 8601. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Real source, used when nothing is injected. */
export function realSource(): TraceSource {
  return { now: nowIso, id: generateId };
}
