import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readVersion } from "../version.js";
import { TOOL_NAME, TOOL_DESCRIPTION, inputShape, outputShape, executeSetup } from "./tool.js";

/** Nome com que o servidor se identifica no handshake. */
export const SERVER_NAME = "common-rules";

/**
 * Monta o servidor com a única tool desta fatia.
 *
 * A versão vem de `readVersion()`, a mesma fonte que o comando de terminal
 * reporta, para que os dois pontos de entrada não possam divergir por
 * esquecimento.
 */
export function createServer(): McpServer {
  const servidor = new McpServer({ name: SERVER_NAME, version: readVersion() });

  servidor.registerTool(
    TOOL_NAME,
    { description: TOOL_DESCRIPTION, inputSchema: inputShape, outputSchema: outputShape },
    async (args) => executeSetup(args),
  );

  return servidor;
}
