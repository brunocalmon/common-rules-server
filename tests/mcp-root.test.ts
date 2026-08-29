import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { validateRoot } from "../src/mcp/root";
import { projetoDescartavel, diretorioVazio } from "./mcp-fixtures";

describe("AC-011 — um caminho que não existe é recusado", () => {
  const ausente = join(diretorioVazio(), "nao-existe", "nem-um-pouco");

  // SPECSFY: US-002 FR-003 AC-011
  it("recusa o caminho", () => {
    expect(validateRoot(ausente).ok).toBe(false);
  });

  // SPECSFY: US-002 FR-006 AC-011
  it("informa que o caminho não foi encontrado", () => {
    const r = validateRoot(ausente);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/não encontrad/i);
  });

  // SPECSFY: US-002 NFR-001 AC-011
  it("não cria diretório algum para acomodá-lo", () => {
    validateRoot(ausente);
    expect(existsSync(ausente)).toBe(false);
  });
});

describe("AC-012 — um caminho relativo é recusado", () => {
  // SPECSFY: US-002 FR-003 AC-012
  it("recusa em vez de resolver contra alguma base", () => {
    expect(validateRoot("./algum/projeto").ok).toBe(false);
  });

  // SPECSFY: US-002 FR-002 AC-012
  it("pede caminho absoluto na explicação", () => {
    const r = validateRoot("./algum/projeto");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/absolut/i);
  });

  // SPECSFY: US-002 NFR-003 AC-012
  it("recusa mesmo quando o relativo existiria a partir do diretório de trabalho", () => {
    // O nome é escolhido para existir sob a raiz válida, de modo que resolver
    // contra o diretório de trabalho produziria escrita plausível e silenciosa.
    const raiz = projetoDescartavel();
    expect(existsSync(join(raiz, ".claude"))).toBe(true);
    expect(validateRoot(".claude").ok).toBe(false);
  });
});

describe("AC-003 — a validação aceita uma raiz real e recusa diretório sem marcador", () => {
  // SPECSFY: US-002 FR-003 AC-003
  it("aceita uma raiz com marcador de projeto", () => {
    expect(validateRoot(projetoDescartavel()).ok).toBe(true);
  });

  // SPECSFY: US-002 FR-003 AC-003
  it("recusa um diretório sem marcador algum", () => {
    expect(validateRoot(diretorioVazio()).ok).toBe(false);
  });
});
