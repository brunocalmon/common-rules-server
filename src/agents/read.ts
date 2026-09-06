import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CONFIG_PATH } from "../config/write.js";
import { parse } from "../config/yaml.js";
import type { AgentProfile, MaestroSection } from "../config/schema.js";
import { describeProblem, validateProfileShape, validateUniqueNames, type ProfileProblem } from "./profile.js";

/** Propriedades cujo `value` é um caminho que precisa existir em disco. */
const PATH_PROPERTIES = [
  ["identity", "description"],
  ["instruction", "behavior"],
  ["instruction", "additional_behavior"],
] as const;

/**
 * Fontes de sistema de arquivos, injetadas para a leitura ser testável sem
 * inventar um disco — mesmo padrão já usado por `doctor.ts`.
 */
export interface AgentEnvironment {
  exists(path: string): boolean;
  read(path: string): string;
}

export function realAgentEnvironment(): AgentEnvironment {
  return { exists: (p) => existsSync(p), read: (p) => readFileSync(p, "utf8") };
}

export interface AgentConfig {
  maestro: AgentProfile;
  subagents: AgentProfile[];
}

/** Divergências que a leitura recusa e o `doctor` relata — o mesmo conjunto, calculado uma vez só. */
export function collectProblems(root: string, env: AgentEnvironment = realAgentEnvironment()): ProfileProblem[] {
  const configPath = join(root, CONFIG_PATH);
  if (!env.exists(configPath)) {
    return [{ profile: "<config>", property: CONFIG_PATH, reason: "arquivo de configuração ausente" }];
  }

  const document = parse(env.read(configPath)).toJSON() as { maestro?: MaestroSection };
  const maestro = document.maestro;
  if (maestro === undefined) {
    return [{ profile: "<config>", property: "maestro", reason: "seção ausente" }];
  }

  const subagents = Array.isArray(maestro.subagents) ? maestro.subagents : [];
  const profiles = [maestro, ...subagents];
  const problems = [
    ...profiles.flatMap((profile) => validateProfileShape(profile)),
    ...validateUniqueNames(profiles),
  ];

  // Só resolve caminho depois que a forma bate: apontar "arquivo não existe"
  // sobre uma propriedade malformada confundiria a causa real.
  if (problems.length > 0) return problems;

  for (const profile of profiles) {
    const name = profile.identity?.name?.value ?? "<sem nome>";
    const groups = profile as unknown as Record<string, Record<string, { value: unknown }> | undefined>;

    for (const [group, key] of PATH_PROPERTIES) {
      const declared = groups[group]?.[key]?.value;
      if (typeof declared !== "string" || declared === "") continue;
      if (!env.exists(join(root, declared))) {
        problems.push({ profile: name, property: `${group}.${key}`, reason: `arquivo não encontrado: ${declared}` });
      }
    }

    const skills = groups.capability?.skills?.value;
    for (const skill of Array.isArray(skills) ? (skills as string[]) : []) {
      if (!env.exists(join(root, skill))) {
        problems.push({ profile: name, property: "capability.skills", reason: `caminho não encontrado: ${skill}` });
      }
    }
  }
  return problems;
}

/**
 * Carrega os perfis de agente do projeto.
 *
 * Recusa em voz alta diante de qualquer divergência, nomeando perfil,
 * propriedade e motivo (`FR-003`): um perfil parcialmente válido levaria o
 * planejamento a decidir sobre estado que a pessoa não escreveu.
 */
export function readAgentConfig(root: string, env: AgentEnvironment = realAgentEnvironment()): AgentConfig {
  const problems = collectProblems(root, env);
  if (problems.length > 0) {
    throw new Error(`configuração de agentes inválida:\n  ${problems.map(describeProblem).join("\n  ")}`);
  }

  const document = parse(env.read(join(root, CONFIG_PATH))).toJSON() as { maestro: MaestroSection };
  const { subagents, ...maestro } = document.maestro;
  return { maestro: maestro as AgentProfile, subagents: Array.isArray(subagents) ? subagents : [] };
}
