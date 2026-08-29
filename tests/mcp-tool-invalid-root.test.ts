import { describe, it, expect } from "vitest";
import { executeSetup } from "../src/mcp/tool";
import { arvore, diretorioVazio } from "./mcp-fixtures";

describe("AC-003 — um diretório sem marcador de projeto é recusado", () => {
  // SPECSFY: US-002 FR-003 AC-003
  it("devolve erro", async () => {
    expect((await executeSetup({ project_root: diretorioVazio() })).isError).toBe(true);
  });

  // SPECSFY: US-002 FR-006 AC-003
  it("explica que o caminho não aparenta ser um projeto", async () => {
    const r = await executeSetup({ project_root: diretorioVazio() });
    expect(JSON.stringify(r.content)).toMatch(/projeto/i);
  });

  // SPECSFY: US-002 NFR-001 AC-003
  it("não cria arquivo nesse diretório", async () => {
    const vazio = diretorioVazio();
    await executeSetup({ project_root: vazio });
    expect(arvore(vazio)).toEqual([]);
  });
});
