import { describe, it, expect, afterEach } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { executeSetup } from "../src/mcp/tool";
import { arvore, projetoDescartavel } from "./mcp-fixtures";

const original = process.cwd();
afterEach(() => process.chdir(original));

describe("AC-005 — o diretório de trabalho do processo aponta para outro lugar", () => {
  // SPECSFY: US-002 FR-002 AC-005
  it("os arquivos aparecem dentro do projeto informado", async () => {
    const alheio = projetoDescartavel("crs-alheio-");
    const alvo = projetoDescartavel("crs-alvo-");
    process.chdir(alheio);
    await executeSetup({ project_root: alvo });
    expect(existsSync(join(alvo, ".common-rules", "install.json"))).toBe(true);
  });

  // SPECSFY: US-002 NFR-001 AC-005
  it("nada é criado no diretório de trabalho do processo", async () => {
    const alheio = projetoDescartavel("crs-alheio-");
    const alvo = projetoDescartavel("crs-alvo-");
    process.chdir(alheio);
    const antes = arvore(alheio);
    await executeSetup({ project_root: alvo });
    expect(arvore(alheio)).toEqual(antes);
  });

  // SPECSFY: US-002 NFR-003 AC-005
  it("o resultado não muda quando o diretório de trabalho muda", async () => {
    const alvoA = projetoDescartavel("crs-a-");
    const alvoB = projetoDescartavel("crs-b-");
    process.chdir(projetoDescartavel("crs-alheio-"));
    const a = await executeSetup({ project_root: alvoA });
    process.chdir(original);
    const b = await executeSetup({ project_root: alvoB });
    expect(a.structuredContent?.hooks.map((h) => h.name)).toEqual(b.structuredContent?.hooks.map((h) => h.name));
  });
});
