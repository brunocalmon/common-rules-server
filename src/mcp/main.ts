#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

// A entrada apenas liga o servidor ao transporte. Nenhuma lógica vive aqui,
// para que nada do que a suíte cobre fique fora dela.
await createServer().connect(new StdioServerTransport());
