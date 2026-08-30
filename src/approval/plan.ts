import type { ApprovalRegistry } from "./registry.js";
import { isApproved } from "./registry.js";

export type DependencyCommandKind = "skills" | "specsfy" | "bridge";

export interface DependencyCommandItem {
  kind: DependencyCommandKind;
  label: string;
  bin: string;
  args: string[];
}

/**
 * O que `src/setup/run.ts` já sabe sobre um comando de dependência: se está
 * pendente, e o `bin`/`args` reais, resolvidos sem executar nada.
 */
export interface CommandCandidate {
  kind: DependencyCommandKind;
  label: string;
  command: { bin: string; args: string[] } | null;
  pending: boolean;
}

/** Só candidatos pendentes com comando resolvido entram no plano (`AC-117`). */
export function assembleDependencyCommands(candidates: readonly CommandCandidate[]): DependencyCommandItem[] {
  return candidates
    .filter((c): c is CommandCandidate & { command: { bin: string; args: string[] } } => c.pending && c.command !== null)
    .map((c) => ({ kind: c.kind, label: c.label, bin: c.command.bin, args: c.command.args }));
}

export function partitionByApproval(
  registry: ApprovalRegistry,
  items: readonly DependencyCommandItem[],
): { approved: DependencyCommandItem[]; pending: DependencyCommandItem[] } {
  const approved: DependencyCommandItem[] = [];
  const pending: DependencyCommandItem[] = [];
  for (const item of items) (isApproved(registry, item) ? approved : pending).push(item);
  return { approved, pending };
}

/** Função pura: devolve um novo registro com os itens acrescentados, sem duplicar. */
export function recordApproval(registry: ApprovalRegistry, items: readonly DependencyCommandItem[]): ApprovalRegistry {
  const commands = [...registry.commands];
  for (const item of items) {
    if (!isApproved({ commands }, item)) commands.push({ bin: item.bin, args: item.args });
  }
  return { commands };
}
