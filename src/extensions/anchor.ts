import { createHash } from "node:crypto";

/**
 * HTML comment, same pattern `.specsfy/Spec.md` already documents and uses
 * for Specsfy (`<!-- specsfy:framework:start/end -->`) — `DEC-080`.
 */
export function anchorMarkers(category: string, name: string): { start: string; end: string } {
  return {
    start: `<!-- common-rules:${category}:${name}:start -->`,
    end: `<!-- common-rules:${category}:${name}:end -->`,
  };
}

/**
 * Inserts the block at the end of the existing content, or replaces the
 * block already present with the same marker — never touches content
 * outside of it.
 */
export function insertAnchor(fileContent: string, category: string, name: string, content: string): string {
  const { start, end } = anchorMarkers(category, name);
  const block = `${start}\n${content}\n${end}`;
  const existing = readAnchorRange(fileContent, start, end);
  if (existing === null) {
    const separator = fileContent.length > 0 && !fileContent.endsWith("\n") ? "\n" : "";
    return `${fileContent}${separator}${block}\n`;
  }
  return fileContent.slice(0, existing.from) + block + fileContent.slice(existing.to);
}

export function readAnchor(fileContent: string, category: string, name: string): string | null {
  const { start, end } = anchorMarkers(category, name);
  const range = readAnchorRange(fileContent, start, end);
  if (range === null) return null;
  const block = fileContent.slice(range.from, range.to);
  return block.slice(start.length, block.length - end.length).replace(/^\n/, "").replace(/\n$/, "");
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
