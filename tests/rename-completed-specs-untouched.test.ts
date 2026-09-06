import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "..");

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc.sort();
}

/**
 * Só as specs que já estavam concluídas quando a renomeação começou
 * (`0001` a `0013`). Incluir a árvore inteira faria o guard-rail disparar a
 * cada spec nova que completasse — inclusive a própria SPEC-0014 —, o que é
 * movimento legítimo do framework, não a reescrita de histórico que o AC-010
 * proíbe.
 */
function predatesRename(file: string): boolean {
  const match = /specs\/completed\/(\d{4})-/.exec(file);
  return match !== null && Number(match[1]) <= 13;
}

function hashTree(dir: string): string {
  const hash = createHash("sha256");
  for (const file of walk(dir).filter(predatesRename)) {
    hash.update(file.slice(dir.length));
    hash.update(readFileSync(file));
  }
  return hash.digest("hex");
}

// Snapshot fixado antes de qualquer edição desta entrega (SPEC-0014).
// Recalculado uma única vez em 2026-09-06, com `specs/completed/` no
// estado herdado de antes desta renomeação começar.
const EXPECTED_COMPLETED_SPECS_HASH = "3554acef7080f21330ca670cf0fd9aa2cc49a8216edc1f4804ae8c823fea00ea";

describe("AC-010 — specs/completed/ permanece byte a byte idêntico (guard-rail)", () => {
  // SPECSFY: US-001 FR-004 NFR-002 AC-010
  it("o hash da árvore specs/completed/ não muda em nenhuma tarefa desta entrega", () => {
    expect(hashTree(resolve(ROOT, "specs", "completed"))).toBe(EXPECTED_COMPLETED_SPECS_HASH);
  });
});

describe("AC-011 — documentação viva usa o nome novo", () => {
  // SPECSFY: US-001 FR-004 AC-011
  it("docs/, PROJECT.md e .specsfy/STACK.md não contêm mais common-rules", () => {
    const paths = ["docs", "PROJECT.md", resolve(".specsfy", "STACK.md")].map((p) => resolve(ROOT, p));
    const offenders: string[] = [];
    for (const p of paths) {
      const files = statSync(p).isDirectory() ? walk(p) : [p];
      for (const file of files) {
        if (readFileSync(file, "utf8").includes("common-rules")) offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});
