import { describe, it, expect } from "vitest";
import { chmodSync } from "node:fs";
import { join } from "node:path";
import { executeSetup } from "../src/mcp/tool";
import { projetoDescartavel } from "./mcp-fixtures";

/** Torna a raiz válida porém não gravável, para exercitar o caminho de erro real. */
function raizSemPermissao(): string {
  const raiz = projetoDescartavel("crs-ro-");
  chmodSync(join(raiz, ".claude"), 0o500);
  chmodSync(raiz, 0o500);
  return raiz;
}

describe("AC-009 — um erro durante a configuração não vira sucesso", () => {
  // SPECSFY: US-001 FR-006 AC-009
  it("devolve erro", async () => {
    expect((await executeSetup({ project_root: raizSemPermissao() })).isError).toBe(true);
  });

  // SPECSFY: US-003 FR-005 AC-009
  it("descreve o que impediu a operação", async () => {
    const r = await executeSetup({ project_root: raizSemPermissao() });
    expect(JSON.stringify(r.content)).toMatch(/permiss|EACCES/i);
  });

  // SPECSFY: US-001 FR-005 AC-009
  it("não afirma que a configuração foi concluída", async () => {
    const r = await executeSetup({ project_root: raizSemPermissao() });
    expect(JSON.stringify(r.content)).not.toMatch(/instalad|configurado com sucesso/i);
  });
});
