import { interpretDecision, type ApprovalResult } from "../approval/decide.js";
import { nowIso } from "../telemetry/trace.js";
import { writeApprovedPlan } from "./store.js";
import type { ApprovedPlan, OrchestrationPlan } from "./model.js";

/**
 * Decision source for an orchestration plan.
 *
 * Deliberately narrower than `SPEC-0007`'s: that gate asks about hooks and
 * dependency commands, this one asks about who will do the work. Same
 * channel and same refusal rule, different question (`DEC-002`).
 */
export interface PlanDecisionSource {
  ask(): boolean;
}

export interface PlanDecision extends ApprovalResult {
  /** Where the artifact landed, when approved — absent on refusal. */
  writtenTo?: string;
}

/**
 * Runs the approval gate over an assembled plan.
 *
 * Writes only on an explicit yes. Refusal, silence and an unreadable answer
 * all leave the filesystem untouched, because they arrive here as the same
 * negative through `interpretDecision` (`NFR-002`).
 */
export function decidePlan(
  root: string,
  plan: OrchestrationPlan,
  source: PlanDecisionSource,
  now: () => string = nowIso,
): PlanDecision {
  const result = interpretDecision(() => source.ask());
  if (!result.approved) return result;

  const approved: ApprovedPlan = { ...plan, approvedAt: now() };
  return { ...result, writtenTo: writeApprovedPlan(root, approved) };
}
