import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { executeSetup } from "../src/mcp/tool";
import { projetoDescartavel } from "./mcp-fixtures";

describe("AC-007 — a segunda chamada reconhece o estado", () => {
  // SPECSFY: US-003 FR-004 AC-007
  it("informa que já estava configurado", async () => {
    const raiz = projetoDescartavel();
    await executeSetup({ project_root: raiz });
    const segunda = await executeSetup({ project_root: raiz });
    expect(JSON.stringify(segunda.content)).toMatch(/já estava configurado/i);
  });

  // SPECSFY: US-003 NFR-002 AC-007
  it("mantém o registro com sete entradas", async () => {
    const raiz = projetoDescartavel();
    await executeSetup({ project_root: raiz });
    await executeSetup({ project_root: raiz });
    const reg = JSON.parse(readFileSync(join(raiz, ".common-rules", "install.json"), "utf8"));
    expect(reg.hooks).toHaveLength(7);
  });

  // SPECSFY: US-003 FR-004 AC-007
  it("não relata a segunda chamada como instalação nova", async () => {
    const raiz = projetoDescartavel();
    await executeSetup({ project_root: raiz });
    const segunda = await executeSetup({ project_root: raiz });
    expect(segunda.structuredContent?.changed).toBe(false);
  });
});
