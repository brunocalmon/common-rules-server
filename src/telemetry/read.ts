import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { RECORD_PATH } from "../setup/record.js";

/**
 * Resultado da leitura do identificador.
 *
 * Os três casos são representados explicitamente em vez de por texto vazio,
 * para que quem consome distinga "não há registro" de "há registro sem
 * identificador". Colapsar os dois num valor vazio perderia justamente a
 * informação que o diagnóstico precisa dar.
 */
export type TraceRead =
  | { kind: "identified"; trace: string }
  | { kind: "unidentified" }
  | { kind: "absent" };

/**
 * Lê o identificador da última execução registrada, sem escrever.
 *
 * Aceita registros gravados antes desta fatia, que não têm o campo e cujas
 * entradas trazem o instante da época. Nada é reescrito na leitura: relatar e
 * reparar são operações distintas neste produto.
 */
export function readTrace(root: string): TraceRead {
  const caminho = join(root, RECORD_PATH);
  if (!existsSync(caminho)) return { kind: "absent" };
  try {
    const bruto = JSON.parse(readFileSync(caminho, "utf8")) as { trace?: unknown };
    const trace = bruto.trace;
    if (typeof trace === "string" && trace.length > 0) return { kind: "identified", trace };
    return { kind: "unidentified" };
  } catch {
    // Registro ilegível é tratado como ausência de identificador, e não como
    // falha do diagnóstico: o `doctor` continua relatando as dependências.
    return { kind: "unidentified" };
  }
}
