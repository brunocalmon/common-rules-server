/**
 * Classifica mensagens de commit da entrega de renomeação (SPEC-0014, AC-012).
 *
 * A auditabilidade pedida pelo AC-012 é "dá para ver, olhando o histórico,
 * que a renomeação não veio misturada com lógica nova". Inspecionar o diff
 * de cada commit por heurística seria adivinhação; o que dá para verificar
 * de forma determinística é a convenção de mensagem. Por isso a função é
 * pura: recebe as mensagens já lidas por quem chamou e devolve a
 * classificação, sem tocar em git nem em disco.
 */

/** Prefixo que marca um commit como rebranding puro. */
export const RENAME_PREFIX = "rename:";

/**
 * @param {readonly string[]} messages mensagens de commit, na ordem em que vieram.
 * @returns {{ message: string, accepted: boolean }[]} uma entrada por mensagem, preservando a ordem.
 */
export function classifyRenameCommits(messages) {
  return messages.map((message) => ({
    message,
    accepted: message.startsWith(RENAME_PREFIX),
  }));
}
