/**
 * Origens aceitas para conjuntos de skills de engenharia, pelo mesmo instalador `skills`.
 *
 * O autor de `mattpocock/skills` não publica no registro npm. O
 * `mattpocock-skills` que existe lá é publicação de terceiro, e o caminho que
 * o README do autor documenta é `npx skills@latest add mattpocock/skills`.
 * `promovaweb/specsfy` é a segunda origem oficial: é de lá que as skills do
 * próprio framework Specsfy chegam a `.claude/skills/`, pelo mesmo instalador
 * (`DEC-029`). Skills entram no contexto do agente como instruções, e por
 * isso a procedência é regra e não preferência.
 */
export const OFFICIAL_SOURCE = "mattpocock/skills";

/** As duas origens oficiais, na ordem em que o `setup` as instala. */
export const OFFICIAL_SOURCES = [OFFICIAL_SOURCE, "promovaweb/specsfy"] as const;

export type SourceCheck =
  | { ok: true; source: string }
  | { ok: false; reason: string };

/**
 * Aceita qualquer uma das origens oficiais e recusa as demais.
 *
 * Devolve resultado em vez de lançar, para que quem chama escolha como
 * reportar. Não toca o sistema de arquivos, de modo que a regra seja
 * exercitável sem instalar nada.
 */
export function resolveSource(input: unknown): SourceCheck {
  const aceitas = OFFICIAL_SOURCES.join(", ");
  if (typeof input !== "string" || input.length === 0) {
    return { ok: false, reason: `origem não reconhecida: valor ausente. As aceitas são ${aceitas}` };
  }
  if (!(OFFICIAL_SOURCES as readonly string[]).includes(input)) {
    return { ok: false, reason: `origem não reconhecida: ${input}. As aceitas são ${aceitas}` };
  }
  return { ok: true, source: input };
}
