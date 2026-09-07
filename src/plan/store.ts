import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ApprovedPlan } from "./model.js";

/** Approved plans, inside the managed directory like every other piece of state. */
export const PLANS_DIR = ".maestro/plans";

function planPath(root: string, traceId: string): string {
  return join(root, PLANS_DIR, `${traceId}.json`);
}

/**
 * Persists an approved plan, named by the run that produced it.
 *
 * The run identifier is already the project's way of correlating what
 * happened (`SPEC-0006`), so the artifact borrows it instead of inventing a
 * sequence — two approvals can't collide, and the file connects back to the
 * run that reported it.
 *
 * Creates the directory when absent: writing must not fail because nothing
 * had been approved before.
 */
export function writeApprovedPlan(root: string, plan: ApprovedPlan): string {
  const target = planPath(root, plan.trace);
  mkdirSync(join(root, PLANS_DIR), { recursive: true });
  writeFileSync(target, `${JSON.stringify(plan, null, 2)}\n`);
  return join(PLANS_DIR, `${plan.trace}.json`);
}

/**
 * Reads an approved plan back by run identifier.
 *
 * Returns `null` for an absent plan — the execution slices ask "was this
 * approved?" and absence is a legitimate answer, not a failure. Malformed
 * content also returns `null` rather than throwing: an unreadable artifact
 * proves nothing was approved, which is the safe reading.
 */
export function readApprovedPlan(root: string, traceId: string): ApprovedPlan | null {
  const target = planPath(root, traceId);
  if (!existsSync(target)) return null;
  try {
    return JSON.parse(readFileSync(target, "utf8")) as ApprovedPlan;
  } catch {
    return null;
  }
}
