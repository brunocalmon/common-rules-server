import { describe, it, expect, afterEach } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { executeSetup } from "../src/mcp/tool";
import { arvore, projetoDescartavel } from "./mcp-fixtures";

const salvo = process.env["CLAUDE_PROJECT_DIR"];
afterEach(() => {
  if (salvo === undefined) delete process.env["CLAUDE_PROJECT_DIR"];
  else process.env["CLAUDE_PROJECT_DIR"] = salvo;
});

describe("AC-008 — variáveis de projeto no ambiente não influenciam a escrita", () => {
  // SPECSFY: US-002 FR-002 AC-008
  it("escreve na raiz informada pela tool", async () => {
    const doAmbiente = projetoDescartavel("crs-env-");
    const alvo = projetoDescartavel("crs-alvo-");
    process.env["CLAUDE_PROJECT_DIR"] = doAmbiente;
    await executeSetup({ project_root: alvo });
    expect(existsSync(join(alvo, ".common-rules", "install.json"))).toBe(true);
  });

  // SPECSFY: US-002 NFR-001 AC-008
  it("deixa o projeto indicado pelo ambiente intocado", async () => {
    const doAmbiente = projetoDescartavel("crs-env-");
    const alvo = projetoDescartavel("crs-alvo-");
    process.env["CLAUDE_PROJECT_DIR"] = doAmbiente;
    const antes = arvore(doAmbiente);
    await executeSetup({ project_root: alvo });
    expect(arvore(doAmbiente)).toEqual(antes);
  });

  // SPECSFY: US-002 NFR-003 AC-008
  it("recusa quando só o ambiente aponta um projeto e a tool não recebe raiz", async () => {
    process.env["CLAUDE_PROJECT_DIR"] = projetoDescartavel("crs-env-");
    expect((await executeSetup({})).isError).toBe(true);
  });
});
