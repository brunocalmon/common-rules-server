import { randomBytes } from "node:crypto";

/** Comprimento fixo do identificador, em caracteres hexadecimais. */
export const TRACE_ID_LENGTH = 32;

/**
 * Origem do que não é determinístico nesta ferramenta.
 *
 * É a única fonte de instante e de identificador, e existe para ser
 * substituível num lugar só. A fatia 1b tentou o caminho oposto — congelar o
 * instante em `new Date(0)` para dar previsibilidade aos casos — e o resultado
 * foi um registro que afirmava, em toda máquina, que a instalação ocorrera em
 * 1970. Determinismo se compra injetando a fonte, não falsificando o valor.
 */
export interface TraceSource {
  /** Instante corrente, em ISO 8601. */
  now(): string;
  /** Identificador da execução. */
  id(): string;
}

/**
 * Produz um identificador opaco.
 *
 * Deriva de bytes aleatórios e não de dado do ambiente, de modo que a
 * opacidade seja propriedade da construção em vez de resultado de filtragem:
 * não há nome de pessoa, de máquina ou caminho a remover, porque nenhum entra.
 */
export function generateId(): string {
  return randomBytes(TRACE_ID_LENGTH / 2).toString("hex");
}

/** Instante corrente do relógio do sistema, em ISO 8601. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Origem real, usada quando nada é injetado. */
export function realSource(): TraceSource {
  return { now: nowIso, id: generateId };
}
