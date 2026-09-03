/**
 * Context that decides the approval channel.
 *
 * Consulting only whether standard input has a terminal, and not a flag,
 * is this fatia's choice: whoever automates doesn't need to remember to
 * pass anything, and silence is never interpreted as consent.
 */
export interface TerminalContext {
  hasTerminal(): boolean;
}

/**
 * Real context, consulting the process.
 *
 * `process.stdin.isTTY` is `undefined` outside an interactive terminal,
 * which is falsy for the channel choice — the same treatment as `false`,
 * no special case.
 */
export function realTerminalContext(): TerminalContext {
  return { hasTerminal: () => Boolean(process.stdin.isTTY) };
}

export type ApprovalChannel = "interactive" | "document";

/**
 * Chooses the channel by terminal presence.
 *
 * Without an injected context, consults the real process — but never
 * approves by default: choosing the channel and the decision itself are
 * separate steps.
 */
export function resolveChannel(ctx: TerminalContext = realTerminalContext()): ApprovalChannel {
  return ctx.hasTerminal() ? "interactive" : "document";
}
