import type { AgentProfile } from "../config/schema.js";
import type { OrchestrationPlan, PlannedRuntime } from "./model.js";

/** What the assembly needs, all of it already determined elsewhere. */
export interface AssembleInput {
  /** Profiles read from the project's config — the first one leads (`AC-003`). */
  profiles: readonly AgentProfile[];
  /** Agent backends detected in the environment (`SPEC-0008`). */
  backends: readonly string[];
  /** Model recommendation as `recommend()` produced it (`SPEC-0009`), consumed as is. */
  recommendation: { backend: string | null; localModel: string | null };
  task: string;
  trace: string;
  createdAt: string;
}

/**
 * Assembles the deterministic skeleton of a plan.
 *
 * Always proposes exactly one agent (`DEC-006`). Deciding that a task splits
 * into three would require understanding the task, and this function has no
 * way to understand anything — it has profiles, backends and a memory-based
 * recommendation. So it proposes the one agent it can defend and attaches
 * everything it detected, leaving decomposition to whoever reads the output
 * with the task in mind.
 *
 * Pure on purpose: the empty-environment case is exactly the one hardest to
 * reproduce on a real machine, and it's the one where inventing a value
 * would be most tempting.
 */
export function assemblePlan(input: AssembleInput): OrchestrationPlan {
  const lead = input.profiles[0];
  const profileNames = input.profiles.map((profile) => profile.identity.name.value);

  // The configured model wins over the recommendation: the person wrote it
  // down, the recommendation only computed it. Empty means "not stated",
  // which falls through to what was detected, and then to absence.
  const configured = lead?.cognition?.model?.value ?? "";
  const model = configured !== "" ? configured : input.recommendation.localModel;

  return {
    trace: input.trace,
    createdAt: input.createdAt,
    task: input.task,
    agents: [
      {
        profile: lead?.identity?.name?.value ?? "maestro",
        model: model === "" ? null : model,
        runtime: (lead?.execution?.runtime?.value ?? "auto") as PlannedRuntime,
      },
    ],
    candidates: {
      profiles: profileNames,
      backends: [...input.backends],
    },
  };
}
