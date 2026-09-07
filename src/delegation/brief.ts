import type { AgentProfile } from "../config/schema.js";
import type { ApprovedPlan, PlannedAgent } from "../plan/model.js";
import { composeBehavior } from "./behavior.js";

/** Configuração mínima que o briefing precisa: o maestro e seus subagents, já validados pela SPEC-0015. */
export interface DelegationConfig {
  maestro: AgentProfile;
  subagents: AgentProfile[];
}

/** Lê um caminho referenciado por um perfil, ou `null` quando não há nada nele. */
export type FileReader = (path: string) => string | null;

/** Um agente pronto para delegar — comportamento já composto, não caminhos. */
export interface AgentBrief {
  profile: string;
  model: string | null;
  behavior: string;
  skills: string[];
  tools: string[];
}

function findProfile(config: DelegationConfig, name: string): AgentProfile | undefined {
  if (config.maestro.identity.name.value === name) return config.maestro;
  return config.subagents.find((p) => p.identity.name.value === name);
}

/** `""` na config é "nada declarado" (SPEC-0015); só um caminho real vira leitura. */
function readOrNull(path: string, read: FileReader): string | null {
  return path === "" ? null : read(path);
}

/**
 * Monta um briefing por agente planejado.
 *
 * Resolve o perfil pelo nome, compõe o comportamento e reúne capacidade e
 * modelo — tudo o que o agente hospedeiro precisaria descobrir sozinho para
 * delegar, entregue pronto (`FR-003`).
 */
export function buildBriefs(
  plan: ApprovedPlan,
  config: DelegationConfig,
  read: FileReader,
  base: string,
): AgentBrief[] {
  return plan.agents.map((planned: PlannedAgent) => {
    const profile = findProfile(config, planned.profile);
    if (profile === undefined) {
      throw new Error(`briefing recusado: perfil "${planned.profile}" não existe na configuração`);
    }
    const behavior = composeBehavior({
      base,
      behavior: readOrNull(profile.instruction.behavior.value, read),
      additional: readOrNull(profile.instruction.additional_behavior.value, read),
    });
    return {
      profile: planned.profile,
      model: planned.model,
      behavior,
      skills: profile.capability.skills.value,
      tools: profile.capability.tools.value,
    };
  });
}

/** Renderiza os briefings em texto para o agente hospedeiro ler. */
export function renderBriefs(briefs: readonly AgentBrief[]): string {
  return briefs
    .map((brief) =>
      [
        `## ${brief.profile}`,
        `model: ${brief.model ?? "none detected"}`,
        `skills: ${brief.skills.join(", ") || "none"}`,
        `tools: ${brief.tools.join(", ") || "none"}`,
        "",
        brief.behavior,
      ].join("\n"),
    )
    .join("\n\n");
}
