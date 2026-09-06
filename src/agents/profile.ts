import type { AgentProfile, ConfiguredProperty, PropertyMode } from "../config/schema.js";

/** Os dois únicos valores que `mode` aceita (`FR-003`). */
export const PROPERTY_MODES: readonly PropertyMode[] = ["suggested", "required"];

/** Grupos que compõem um perfil; `subagents` fica de fora porque é lista, não propriedade. */
const PROFILE_GROUPS = ["identity", "cognition", "instruction", "capability", "execution"] as const;

/**
 * Divergência encontrada num perfil.
 *
 * Carrega perfil, propriedade e motivo separados em vez de uma frase pronta,
 * porque o mesmo achado é consumido por dois lugares com formatos diferentes:
 * a recusa da leitura (`read.ts`) e o relatório do `doctor` (`diagnose.ts`).
 */
export interface ProfileProblem {
  /** Nome do perfil, ou `<sem nome>` quando é justamente o nome que falta. */
  profile: string;
  /** Caminho da propriedade dentro do perfil, como `instruction.behavior`. */
  property: string;
  reason: string;
}

/** Descreve a divergência em uma linha, para mensagem de erro e relatório. */
export function describeProblem(problem: ProfileProblem): string {
  return `${problem.profile}: ${problem.property} — ${problem.reason}`;
}

function isConfiguredProperty(value: unknown): value is ConfiguredProperty<unknown> {
  return typeof value === "object" && value !== null && "value" in value && "mode" in value;
}

function profileName(profile: unknown): string {
  const name = (profile as AgentProfile | undefined)?.identity?.name?.value;
  return typeof name === "string" && name.length > 0 ? name : "<sem nome>";
}

/**
 * Valida a forma de um perfil, sem tocar em disco.
 *
 * Valida só o que o perfil declara: um perfil pode trazer qualquer
 * combinação de grupos e propriedades, do nome sozinho ao conjunto completo
 * (`D6` do épico). Grupo ausente não é divergência — é uma escolha da pessoa,
 * e o default de fábrica cobre o resto.
 *
 * Separada da leitura de propósito: a estrutura pode ser verificada sobre um
 * objeto em memória, e só a resolução de caminho precisa do sistema de
 * arquivos. Devolve tudo que encontrou em vez de parar no primeiro problema,
 * para a pessoa corrigir de uma vez.
 */
export function validateProfileShape(profile: unknown): ProfileProblem[] {
  const problems: ProfileProblem[] = [];
  const name = profileName(profile);

  if (typeof profile !== "object" || profile === null) {
    return [{ profile: name, property: "<perfil>", reason: "não é um objeto" }];
  }

  for (const group of PROFILE_GROUPS) {
    const body = (profile as Record<string, unknown>)[group];
    if (body === undefined) continue;
    if (typeof body !== "object" || body === null) {
      problems.push({ profile: name, property: group, reason: "grupo não é um objeto" });
      continue;
    }
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      const property = `${group}.${key}`;
      if (!isConfiguredProperty(value)) {
        problems.push({ profile: name, property, reason: "não está no formato { value, mode }" });
        continue;
      }
      if (!PROPERTY_MODES.includes(value.mode as PropertyMode)) {
        problems.push({
          profile: name,
          property,
          reason: `mode inválido: ${String(value.mode)} — use suggested ou required`,
        });
      }
    }
  }
  return problems;
}

/** Nomes repetidos entre perfis: o nome identifica o agente no plano e nos logs, então precisa ser único. */
export function validateUniqueNames(profiles: readonly unknown[]): ProfileProblem[] {
  const seen = new Set<string>();
  const problems: ProfileProblem[] = [];
  for (const profile of profiles) {
    const name = profileName(profile);
    if (seen.has(name)) {
      problems.push({ profile: name, property: "identity.name", reason: "nome repetido entre perfis" });
    }
    seen.add(name);
  }
  return problems;
}
