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
 * Renderiza o plano nas duas formas a partir da mesma lista.
 *
 * As duas derivam de um único percurso, para que `AC-069` não possa falhar
 * por deriva entre implementações que extraem os mesmos campos duas vezes.
 */
export function renderPlan(planned: readonly PlannedItem[]): RenderedPlan {
  const linhas = planned.map((item) => `  ${item.name} — ${item.event} — ${item.target}`);
  const text = [`Plano: ${planned.length} hooks a instalar.`, ...linhas].join("\n");
  const document = JSON.stringify({ items: planned.map((item) => ({ ...item })) });
  return { text, document };
}
