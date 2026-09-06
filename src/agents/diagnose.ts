import { collectProblems, realAgentEnvironment, type AgentEnvironment } from "./read.js";
import { describeProblem, type ProfileProblem } from "./profile.js";

export type { ProfileProblem } from "./profile.js";

/**
 * Relata divergências nos perfis de agente, sem tocar em disco.
 *
 * Função de leitura pura, no mesmo padrão de `extensions/diagnose.ts`
 * (`PR-003`): o `doctor` nunca altera o sistema de arquivos, nem para
 * "consertar" uma referência quebrada. Quem repara é um comando próprio,
 * pedido de propósito.
 *
 * Compartilha `collectProblems` com o leitor de propósito — relatar uma coisa
 * e recusar outra faria o `doctor` mentir sobre o que a execução vai aceitar.
 */
export function diagnoseAgents(root: string, env: AgentEnvironment = realAgentEnvironment()): ProfileProblem[] {
  return collectProblems(root, env);
}

/** Linhas do relatório do `doctor`, uma por divergência. */
export function formatAgentProblems(problems: readonly ProfileProblem[]): string[] {
  return problems.map((problem) => `agent profile: ${describeProblem(problem)}`);
}
