/** Evento canônico que um hook declara, antes de qualquer tradução. */
export type CanonicalEvent = "before-shell" | "after-file-edit" | "stop";

export interface Hook {
  name: string;
  description: string;
  event: CanonicalEvent;
  blocking: boolean;
  script: string;
}

const EVENTS: readonly CanonicalEvent[] = ["before-shell", "after-file-edit", "stop"];

/** Extrai o valor escalar de uma chave do frontmatter, ignorando bloco YAML. */
function scalar(frontmatter: string, key: string): string | null {
  for (const line of frontmatter.split("\n")) {
    const m = /^([A-Za-z_]+):\s*(.*)$/.exec(line);
    if (m && m[1] === key) return (m[2] ?? "").trim();
  }
  return null;
}

/**
 * Extrai o script do corpo do hook.
 *
 * O corpo é prosa em Markdown com um bloco de código contendo o script. Só o
 * conteúdo do bloco é o hook; a prosa explica por que ele existe e não deve
 * chegar ao arquivo de configuração.
 */
function scriptFrom(body: string): string {
  const m = /```(?:bash|sh|shell)?\n([\s\S]*?)```/.exec(body);
  return m?.[1] ?? "";
}

/**
 * Lê um hook no formato canônico e devolve estrutura tipada.
 *
 * Não escreve nada e não traduz: separar leitura de tradução é o que permite
 * verificar a fidelidade do script sem tocar o sistema de arquivos.
 */
export function readHook(raw: string): Hook {
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!m) throw new Error("hook sem frontmatter delimitado por ---");
  const [, frontmatter = "", body = ""] = m;

  const name = scalar(frontmatter, "name");
  const event = scalar(frontmatter, "event");
  if (!name) throw new Error("hook sem nome");
  if (!event || !EVENTS.includes(event as CanonicalEvent)) {
    throw new Error(`hook ${name} declara evento desconhecido: ${event ?? "nenhum"}`);
  }

  return {
    name,
    description: (scalar(frontmatter, "description") ?? "").replace(/^>-\s*/, "").trim(),
    event: event as CanonicalEvent,
    blocking: scalar(frontmatter, "blocking") === "true",
    script: scriptFrom(body),
  };
}
