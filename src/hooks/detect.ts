/** O que a detecção observa no projeto, injetado para não depender da máquina. */
export interface TargetEnvironment {
  hasClaudeCode: boolean;
  files: readonly string[];
}

export interface Detection {
  found: boolean;
  target: string;
  /** Evidência que sustentou a decisão, ou o que faltou para sustentá-la. */
  reason: string;
}

export const TARGET = "claude-code";

/** Caminhos cuja presença conta como evidência de uso do alvo. */
const EVIDENCE = [".claude/settings.json", ".claude/settings.local.json", ".claude/"];

/**
 * Decide se há evidência de uso do alvo, sem escrever nada.
 *
 * Não configurar não é falha. Escrever num editor que a pessoa não usa é pior
 * que não escrever: deixa arquivo órfão que ninguém pediu e ninguém mantém.
 */
export function detectTarget(env: TargetEnvironment): Detection {
  const encontrados = EVIDENCE.filter((e) => env.files.some((f) => f.startsWith(e)));
  if (env.hasClaudeCode && encontrados.length > 0) {
    return { found: true, target: TARGET, reason: `evidência encontrada: ${encontrados.join(", ")}` };
  }
  return {
    found: false,
    target: TARGET,
    reason: `sem evidência de uso de ${TARGET}; nenhum de ${EVIDENCE.join(", ")} está presente`,
  };
}
