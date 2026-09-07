/** Conteúdo já lido dos três lugares que compõem o comportamento de um agente. */
export interface BehaviorParts {
  /** O comportamento padrão semeado (`resources/agents/maestro/behavior.md`), lido uma vez. */
  base: string;
  /** Conteúdo de `instruction.behavior`, ou `null` quando não declarado. */
  behavior: string | null;
  /** Conteúdo de `instruction.additional_behavior`, ou `null` quando não declarado. */
  additional: string | null;
}

/**
 * Compõe o comportamento final de um agente.
 *
 * A regra é a que a `SPEC-0015` fixou: `behavior` substitui o padrão por
 * completo, `additional_behavior` soma a ele. Pura sobre conteúdo já lido —
 * quem resolve os caminhos e trata referência quebrada é o leitor de
 * configuração (`SPEC-0015`), não esta função.
 */
export function composeBehavior(parts: BehaviorParts): string {
  if (parts.behavior !== null) return parts.behavior;
  if (parts.additional !== null) return `${parts.base}\n\n${parts.additional}`;
  return parts.base;
}
