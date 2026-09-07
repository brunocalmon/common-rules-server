import type { TaskTypeRequirement } from "../config/schema.js";

/** Requisito resolvido, na forma que `recommend` consome. */
export interface ResolvedTaskType {
  name: string;
  /** `null` significa tipo sem exigência de janela — distinto de exigir zero. */
  contextWindowMin: number | null;
}

/**
 * Resolve um tipo declarado na configuração.
 *
 * Recusa nomeando o tipo pedido e os disponíveis: um tipo escrito errado
 * silenciosamente ignorado devolveria uma recomendação que parece válida e
 * não respeita exigência nenhuma — falha silenciosa exatamente onde a fatia
 * existe para evitar (`FR-002`, `AC-006`).
 */
export function resolveTaskType(
  types: Record<string, TaskTypeRequirement>,
  name: string,
): ResolvedTaskType {
  const declared = types[name];
  if (declared === undefined) {
    const available = Object.keys(types).sort().join(", ") || "(nenhum declarado)";
    throw new Error(`tipo de tarefa desconhecido: ${name}. Disponíveis: ${available}`);
  }
  return { name, contextWindowMin: declared.context_window_min?.value ?? null };
}
