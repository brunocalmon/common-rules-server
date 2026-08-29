/**
 * Única origem aceita para o conjunto de skills de engenharia.
 *
 * O autor não publica no registro npm. O `mattpocock-skills` que existe lá é
 * publicação de terceiro, e o caminho que o README do autor documenta é
 * `npx skills@latest add mattpocock/skills`. Skills entram no contexto do
 * agente como instruções, e por isso a procedência é regra e não preferência.
 */
export const OFFICIAL_SOURCE = "mattpocock/skills";

export type SourceCheck =
  | { ok: true; source: string }
  | { ok: false; reason: string };

/**
 * Aceita a origem oficial e recusa qualquer outra.
 *
 * Devolve resultado em vez de lançar, para que quem chama escolha como
 * reportar. Não toca o sistema de arquivos, de modo que a regra seja
 * exercitável sem instalar nada.
 */
export function resolveSource(input: unknown): SourceCheck {
  if (typeof input !== "string" || input.length === 0) {
    return { ok: false, reason: `origem não reconhecida: valor ausente. A única aceita é ${OFFICIAL_SOURCE}` };
  }
  if (input !== OFFICIAL_SOURCE) {
    return { ok: false, reason: `origem não reconhecida: ${input}. A única aceita é ${OFFICIAL_SOURCE}` };
  }
  return { ok: true, source: input };
}
