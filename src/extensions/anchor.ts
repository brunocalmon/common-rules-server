import { createHash } from "node:crypto";

/**
 * Comentário HTML, mesmo padrão que `.specsfy/Spec.md` já documenta e usa
 * para o Specsfy (`<!-- specsfy:framework:start/end -->`) — `DEC-080`.
 */
export function anchorMarkers(category: string, name: string): { start: string; end: string } {
  return {
    start: `<!-- common-rules:${category}:${name}:start -->`,
    end: `<!-- common-rules:${category}:${name}:end -->`,
  };
}

/**
 * Insere o bloco no fim do conteúdo existente, ou substitui o bloco já
 * presente com o mesmo marcador — nunca toca o conteúdo fora dele.
 */
export function insertAnchor(fileContent: string, category: string, name: string, content: string): string {
  const { start, end } = anchorMarkers(category, name);
  const bloco = `${start}\n${content}\n${end}`;
  const existente = readAnchorRange(fileContent, start, end);
  if (existente === null) {
    const separador = fileContent.length > 0 && !fileContent.endsWith("\n") ? "\n" : "";
    return `${fileContent}${separador}${bloco}\n`;
  }
  return fileContent.slice(0, existente.from) + bloco + fileContent.slice(existente.to);
}

export function readAnchor(fileContent: string, category: string, name: string): string | null {
  const { start, end } = anchorMarkers(category, name);
  const range = readAnchorRange(fileContent, start, end);
  if (range === null) return null;
  const bloco = fileContent.slice(range.from, range.to);
  return bloco.slice(start.length, bloco.length - end.length).replace(/^\n/, "").replace(/\n$/, "");
}

function readAnchorRange(fileContent: string, start: string, end: string): { from: number; to: number } | null {
  const from = fileContent.indexOf(start);
  if (from === -1) return null;
  const endIndex = fileContent.indexOf(end, from);
  if (endIndex === -1) return null;
  return { from, to: endIndex + end.length };
}

export function computeChecksum(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}
