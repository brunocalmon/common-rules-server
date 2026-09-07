import { interpretDecision, type ApprovalResult } from "../approval/decide.js";

/**
 * The new gate `SPEC-0019` adds before each real spawn — the plan's
 * approval (`SPEC-0016`) authorized who would work, not that every
 * irreversible action may happen now (`PR-003`). One call per agent: a
 * refusal here doesn't affect any other agent's gate (`FR-005`).
 */
export function decideSpawn(ask: () => boolean): ApprovalResult {
  return interpretDecision(ask);
}
