import type { AgentProfile } from "../src/config/schema";
import type { ApprovedPlan, PlannedRuntime } from "../src/plan/model";

const s = <T>(value: T) => ({ value, mode: "suggested" as const });

export function profile(name: string, over: Partial<{ behavior: string; additional: string; skills: string[]; tools: string[] }> = {}): AgentProfile {
  return {
    identity: { name: { value: name, mode: "required" }, description: s("") },
    cognition: { model: s(""), context_budget: s(0.7), reasoning_effort: s("medium") },
    instruction: { behavior: s(over.behavior ?? ""), additional_behavior: s(over.additional ?? "") },
    capability: { skills: s(over.skills ?? []), tools: s(over.tools ?? []), mcp_servers: s([]) },
    execution: { runtime: s("auto"), concurrency: s(1) },
  };
}

export function plan(agents: { profile: string; model: string | null; runtime: PlannedRuntime }[]): ApprovedPlan {
  return {
    trace: "aaaabbbbccccddddeeeeffff00001111",
    createdAt: "2026-09-07T00:00:00.000Z",
    approvedAt: "2026-09-07T00:00:05.000Z",
    task: "renomear um módulo",
    agents,
    candidates: { profiles: agents.map((a) => a.profile), backends: ["claude"] },
  };
}

/** Leitor de arquivo fake: mapeia caminho para conteúdo, e devolve null fora do mapa. */
export const reader = (files: Record<string, string>) => (path: string) => files[path] ?? null;
