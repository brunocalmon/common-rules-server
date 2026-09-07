import type { OrchestrationPlan } from "./model.js";

/** Absence is printed as a word, not as a blank that reads like an oversight. */
const shown = (value: string | null): string => value ?? "none detected";

/**
 * Renders the plan a person decides on.
 *
 * Derived from the same object that gets persisted (`PR-003`): a parallel
 * description would be free to drift from what is actually approved, which
 * is the failure the `SPEC-0007` gate was built to avoid.
 */
export function renderPlan(plan: OrchestrationPlan): string {
  const agents = plan.agents.map(
    (agent) => `  - ${agent.profile} — model ${shown(agent.model)}, runtime ${agent.runtime}`,
  );

  return [
    `orchestration plan for: ${plan.task}`,
    `run ${plan.trace}`,
    "",
    "agents:",
    ...agents,
    "",
    `candidate profiles: ${plan.candidates.profiles.join(", ") || "none"}`,
    `detected backends: ${plan.candidates.backends.join(", ") || "none"}`,
    "",
    // Stated in the plan itself, not only in the prompt around it: the
    // guarantee is the point of the slice, so it travels with the artifact.
    "Nothing runs without your approval. Refusing, answering nothing, or",
    "sending something unreadable all count as a refusal.",
  ].join("\n");
}
