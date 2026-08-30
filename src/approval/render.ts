import type { DependencyCommandItem } from "./plan.js";

/** Item do plano, na mesma forma que `runSetup` já produz por ensaio. */
export interface PlannedItem {
  name: string;
  target: string;
  event: string;
}

export interface RenderedPlan {
  /** Forma legível, para o canal interativo. */
  text: string;
  /** Forma em documento JSON, para o canal automatizado. */
  document: string;
}

/**
 * Renderiza o plano nas duas formas a partir das mesmas duas listas.
 *
 * As duas derivam de um único percurso, para que `AC-069` não possa falhar
 * por deriva entre implementações que extraem os mesmos campos duas vezes.
 * Hooks e comandos de dependência (skills, Specsfy, ponte Python) convivem
 * lado a lado sem se fundir numa estrutura só (`FR-071`) — hooks não têm
 * `bin`/`args`, e o registro persistente desta fatia não se aplica a eles.
 */
export function renderPlan(hooks: readonly PlannedItem[], commands: readonly DependencyCommandItem[] = []): RenderedPlan {
  const hookLines = hooks.map((item) => `  ${item.name} — ${item.event} — ${item.target}`);
  const commandLines = commands.map((c) => `  ${c.label} — ${c.bin} ${c.args.join(" ")}`);
  const text = [
    `Plano: ${hooks.length} hooks e ${commands.length} comandos de dependência a instalar.`,
    ...hookLines,
    ...commandLines,
  ].join("\n");
  const document = JSON.stringify({
    items: hooks.map((item) => ({ ...item })),
    commands: commands.map((c) => ({ ...c })),
  });
  return { text, document };
}
