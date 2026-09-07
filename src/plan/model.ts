/** Runtime through which an agent runs — the domain the config already declares. */
export type PlannedRuntime = "auto" | "native" | "cli";

/**
 * One agent in a plan.
 *
 * `model` is `null`, never an empty string, when nothing was detected:
 * absence has to be readable as absence, not as a name that happens to be
 * blank (`FR-002`).
 */
export interface PlannedAgent {
  profile: string;
  model: string | null;
  runtime: PlannedRuntime;
}

/**
 * What the deterministic assembly produces.
 *
 * `candidates` carries what was detected but not decided — the material the
 * refining agent works from. Keeping it in the plan, rather than leaving the
 * agent to rediscover it, is what makes the split between "the code
 * determines" and "the agent judges" legible (`PR-002`).
 */
export interface OrchestrationPlan {
  trace: string;
  createdAt: string;
  task: string;
  agents: PlannedAgent[];
  candidates: {
    profiles: string[];
    backends: string[];
  };
}

/** A plan a person approved, with the instant that decision happened. */
export interface ApprovedPlan extends OrchestrationPlan {
  approvedAt: string;
}
