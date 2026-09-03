/**
 * Roteador minimalista — um "proxy one-liner" (ADR 001, Épico 2.2): ensina o
 * agente a acionar a skill de fachada declarativamente, em vez de ler os
 * artefatos de extensão inteiros. Mantido pequeno de propósito — o ganho de
 * economia de contexto só se sustenta se o próprio roteador não crescer.
 */
export function buildRouterBlock(): string {
  return [
    "## common-rules",
    "",
    "Para criar, ajustar ou reparar uma extensão local (hook, regra ou este",
    "próprio roteador), acione a skill `common-rules-extension-creator` em vez",
    "de ler `.common-rules/extensions/` diretamente.",
  ].join("\n");
}

/** Ponteiro mínimo, sem duplicar o texto do roteador — aponta para CLAUDE.md. */
export function buildAgentsPointer(): string {
  return "Para o roteador do `common-rules`, leia a seção `common-rules` em `CLAUDE.md`.";
}
