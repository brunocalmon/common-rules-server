import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { executeSetup } from "../src/mcp/tool";
import { projetoDescartavel } from "./mcp-fixtures";

describe("AC-004 — com raiz válida a tool instala e relata", () => {
  // SPECSFY: US-001 FR-005 AC-004
  it("lista os sete hooks com seus eventos", async () => {
    const r = await executeSetup({ project_root: projetoDescartavel() });
    expect(r.isError ?? false).toBe(false);
    expect(r.structuredContent?.hooks).toHaveLength(7);
    for (const h of r.structuredContent!.hooks) expect(h.event).toMatch(/^(PreToolUse|PostToolUse|Stop)$/);
  });

  // SPECSFY: US-001 FR-004 AC-004
  it("cria o arquivo de configuração do alvo dentro da raiz informada", async () => {
    const raiz = projetoDescartavel();
    await executeSetup({ project_root: raiz });
    expect(existsSync(join(raiz, ".claude", "settings.json"))).toBe(true);
  });

  // SPECSFY: US-001 FR-004 AC-004
  it("cria o registro de instalação dentro da raiz informada", async () => {
    const raiz = projetoDescartavel();
    await executeSetup({ project_root: raiz });
    expect(existsSync(join(raiz, ".common-rules", "install.json"))).toBe(true);
  });
});
