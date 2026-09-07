import type { ApprovedPlan } from "../plan/model.js";
import { buildBriefs, renderBriefs, type DelegationConfig, type FileReader } from "./brief.js";

export type DelegationResult = { ok: true; text: string } | { ok: false; reason: string };

/**
 * Roda o gate de delegação sobre um plano já aprovado.
 *
 * `native` e `auto` emitem — `auto` resolve para nativo enquanto essa for a
 * única via entregue (`AC-011`). `cli` é recusado nomeando a fatia que ainda
 * não existe: emitir um briefing que ninguém sabe executar sugeriria
 * capacidade que o projeto não tem (`DEC-003`).
 *
 * Um plano é uma unidade aprovada de uma vez: se qualquer agente pedir
 * `cli`, a execução inteira é recusada, em vez de emitir briefing parcial
 * para os demais — entregar metade do que foi aprovado seria decidir por
 * conta própria o que fazer com a outra metade.
 *
 * Não escreve nada em disco, em nenhum dos dois resultados (`FR-004`).
 */
export function runDelegation(
  plan: ApprovedPlan,
  config: DelegationConfig,
  read: FileReader,
  base: string,
): DelegationResult {
  const unsupported = plan.agents.find((agent) => agent.runtime === "cli");
  if (unsupported) {
    return {
      ok: false,
      reason:
        `agent "${unsupported.profile}" requests runtime cli, which execution by external CLI subprocess ` +
        "doesn't exist yet — that's MA-5, ainda não entregue.",
    };
  }

  try {
    return { ok: true, text: renderBriefs(buildBriefs(plan, config, read, base)) };
  } catch (error) {
    return { ok: false, reason: (error as Error).message };
  }
}
