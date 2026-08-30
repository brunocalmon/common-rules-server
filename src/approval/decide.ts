import { readFileSync } from "node:fs";
import type { ApprovalChannel } from "./context.js";
import { renderPlan, type PlannedItem } from "./render.js";

/** Fonte de decisão, síncrona por desenho — ver `TraceSource` para o mesmo padrão. */
export interface DecisionSource {
  ask(planned: PlannedItem[]): boolean;
}

/** Baixo nível: obtém os bytes de onde a decisão viria. Substituível sem trocar `DecisionSource` inteira. */
export interface StdinReader {
  read(): string;
}

/** Leitor real, síncrono. `readFileSync(0, ...)` bloqueia até EOF. */
export const defaultStdinReader: StdinReader = { read: () => readFileSync(0, "utf8") };

/**
 * Canal de documento: lê um JSON da entrada padrão e aceita apenas `approved: true`.
 *
 * Vazio, texto que não é JSON e JSON sem a forma esperada convergem para
 * negativa, nunca para exceção — quem chama não precisa diferenciar os três.
 */
function documentSource(stdin: StdinReader): DecisionSource {
  return {
    ask: () => {
      const bruto = stdin.read().trim();
      if (bruto.length === 0) return false;
      let valor: unknown;
      try {
        valor = JSON.parse(bruto);
      } catch {
        return false;
      }
      if (typeof valor !== "object" || valor === null) return false;
      return (valor as { approved?: unknown }).approved === true;
    },
  };
}

/**
 * Canal interativo: apresenta o plano e lê a resposta da entrada padrão.
 *
 * Usa o mesmo `StdinReader` do canal de documento; a leitura de uma resposta
 * curta via `readFileSync(0)` é uma simplificação deliberada desta fatia, sem
 * dependência nova para leitura linha a linha.
 */
function interactiveSource(stdin: StdinReader): DecisionSource {
  return {
    ask: (planned) => {
      process.stdout.write(renderPlan(planned).text);
      process.stdout.write("\nAprovar? [s/N] ");
      const resposta = stdin.read().trim().toLowerCase();
      return resposta === "s" || resposta === "sim" || resposta === "y" || resposta === "yes";
    },
  };
}

/** Constrói a fonte real para o canal escolhido. */
export function realSource(channel: ApprovalChannel, stdin: StdinReader = defaultStdinReader): DecisionSource {
  return channel === "interactive" ? interactiveSource(stdin) : documentSource(stdin);
}

export interface ApprovalResult {
  approved: boolean;
  reason?: string;
}

/**
 * Interpreta o resultado de uma fonte, tratando exceção como negativa.
 *
 * Ausência de resposta é negativa, nunca consentimento: uma fonte que lança
 * não pode, por acidente de implementação, liberar a escrita.
 */
export function interpret(source: DecisionSource, planned: PlannedItem[]): ApprovalResult {
  try {
    return source.ask(planned) ? { approved: true } : { approved: false, reason: "recusado" };
  } catch {
    return { approved: false, reason: "a fonte de decisão falhou" };
  }
}
