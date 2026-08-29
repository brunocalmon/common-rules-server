import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../src/mcp/server";
import { readVersion } from "../src/version";

/** Liga um cliente ao servidor por transporte em memória, sem subprocesso. */
async function conectar(): Promise<Client> {
  const [doCliente, doServidor] = InMemoryTransport.createLinkedPair();
  const cliente = new Client({ name: "teste", version: "0.0.0" });
  await Promise.all([createServer().connect(doServidor), cliente.connect(doCliente)]);
  return cliente;
}

describe("AC-001 — a listagem devolve apenas setup", () => {
  // SPECSFY: US-001 FR-001 AC-001
  it("existe exatamente uma tool", async () => {
    expect((await (await conectar()).listTools()).tools).toHaveLength(1);
  });

  // SPECSFY: US-001 FR-001 AC-001
  it("ela se chama setup", async () => {
    expect((await (await conectar()).listTools()).tools[0]?.name).toBe("setup");
  });

  // SPECSFY: US-001 NFR-002 AC-001
  it("seu esquema declara project_root como obrigatório", async () => {
    const tool = (await (await conectar()).listTools()).tools[0];
    expect(tool?.inputSchema?.properties).toHaveProperty("project_root");
    expect(tool?.inputSchema?.required).toContain("project_root");
  });
});

describe("AC-010 — nenhuma superfície das fatias restantes aparece", () => {
  // SPECSFY: US-001 FR-001 AC-010
  it("não existe tool de aprovação, detecção de agente ou seleção de modelo", async () => {
    const nomes = (await (await conectar()).listTools()).tools.map((t) => t.name);
    for (const n of nomes) expect(n).toBe("setup");
  });

  // SPECSFY: US-001 NFR-002 AC-010
  it("a superfície do comando de terminal permanece com três comandos", async () => {
    const { COMMANDS } = await import("../src/cli");
    expect(Object.keys(COMMANDS).sort()).toEqual(["doctor", "setup", "version"]);
  });
});

describe("AC-013 — o servidor se identifica ao cliente", () => {
  // SPECSFY: US-001 FR-001 AC-013
  it("declara seu nome", async () => {
    expect((await conectar()).getServerVersion()?.name).toBe("common-rules");
  });

  // SPECSFY: US-001 NFR-002 AC-013
  it("declara a mesma versão que o comando de terminal reporta", async () => {
    expect((await conectar()).getServerVersion()?.version).toBe(readVersion());
  });
});
