/**
 * Contexto que decide o canal de aprovação.
 *
 * Consultar apenas a presença de terminal na entrada padrão, e não uma flag,
 * é a escolha da fatia: quem automatiza não precisa lembrar de passar nada, e
 * o silêncio nunca é interpretado como consentimento.
 */
export interface TerminalContext {
  hasTerminal(): boolean;
}

/**
 * Contexto real, consultando o processo.
 *
 * `process.stdin.isTTY` é `undefined` fora de um terminal interativo, o que é
 * falso para a escolha do canal — o mesmo tratamento de `false`, sem caso
 * especial.
 */
export function realTerminalContext(): TerminalContext {
  return { hasTerminal: () => Boolean(process.stdin.isTTY) };
}

export type ApprovalChannel = "interactive" | "document";

/**
 * Escolhe o canal pela presença de terminal.
 *
 * Sem contexto injetado, consulta o processo real — mas nunca aprova por
 * omissão: a escolha do canal e a decisão em si são etapas separadas.
 */
export function resolveChannel(ctx: TerminalContext = realTerminalContext()): ApprovalChannel {
  return ctx.hasTerminal() ? "interactive" : "document";
}
