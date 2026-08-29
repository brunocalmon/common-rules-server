import { existsSync, statSync } from "node:fs";
import { isAbsolute, join } from "node:path";

/**
 * Marcadores que fazem um diretório parecer a raiz de um projeto.
 *
 * Vive numa constante nomeada, e não espalhado em condição, porque a seção 13
 * da spec o registra como suposição reversível: se a validação se mostrar
 * frouxa ou estrita demais, o ajuste acontece aqui.
 */
export const PROJECT_MARKERS = [".git", "package.json", ".claude"] as const;

export type RootCheck =
  | { ok: true; root: string }
  | { ok: false; reason: string };

/**
 * Confirma que o caminho informado pode receber a configuração.
 *
 * A observação que originou `R-001` mostrou três servidores do protocolo em
 * execução, dois com o diretório pessoal como diretório de trabalho e um
 * apontando para outro projeto. Nenhum tinha a raiz correta. Por isso esta
 * função não consulta `process.cwd()` nem variável de ambiente: o único dado
 * que ela considera é o argumento recebido.
 *
 * Devolve o resultado em vez de lançar, para que quem chama escolha como
 * reportar a recusa.
 */
export function validateRoot(input: unknown): RootCheck {
  if (typeof input !== "string" || input.length === 0) {
    return { ok: false, reason: "o parâmetro project_root é obrigatório e deve ser um caminho absoluto" };
  }

  // Recusar em vez de resolver: resolver um caminho relativo exigiria uma base,
  // e a única disponível ao processo é o diretório de trabalho — justamente a
  // dependência que esta fatia elimina.
  if (!isAbsolute(input)) {
    return { ok: false, reason: `o caminho ${input} é relativo; informe um caminho absoluto` };
  }

  if (!existsSync(input)) {
    return { ok: false, reason: `caminho não encontrado: ${input}` };
  }

  if (!statSync(input).isDirectory()) {
    return { ok: false, reason: `o caminho ${input} existe mas não é um diretório` };
  }

  const encontrado = PROJECT_MARKERS.some((m) => existsSync(join(input, m)));
  if (!encontrado) {
    return {
      ok: false,
      reason: `o caminho ${input} não aparenta ser um projeto: nenhum de ${PROJECT_MARKERS.join(", ")} foi encontrado`,
    };
  }

  return { ok: true, root: input };
}
