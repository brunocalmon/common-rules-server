import { describe, it, expect } from "vitest";
import { executeSetup } from "../src/mcp/tool";
import { arvore, projetoDescartavel } from "./mcp-fixtures";

describe("AC-002 — acionar sem project_root não escreve nada", () => {
  // SPECSFY: US-002 FR-002 AC-002
  it("devolve erro", async () => {
    expect((await executeSetup({})).isError).toBe(true);
  });

  // SPECSFY: US-002 FR-006 AC-002
  it("nomeia o parâmetro que faltou", async () => {
    const r = await executeSetup({});
    expect(JSON.stringify(r.content)).toMatch(/project_root/);
  });

  // SPECSFY: US-002 NFR-001 AC-002
  it("não cria arquivo em lugar algum", async () => {
    const vizinho = projetoDescartavel();
    const antes = arvore(vizinho);
    await executeSetup({});
    expect(arvore(vizinho)).toEqual(antes);
  });
});
