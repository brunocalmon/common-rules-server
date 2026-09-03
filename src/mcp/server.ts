import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readVersion } from "../version.js";
import { TOOL_NAME, TOOL_DESCRIPTION, inputShape, outputShape, executeSetup } from "./tool.js";

/** Name the server identifies itself with in the handshake. */
export const SERVER_NAME = "common-rules";

/**
 * Assembles the server with this fatia's single tool.
 *
 * The version comes from `readVersion()`, the same source the terminal
 * command reports, so the two entry points can't drift apart by accident.
 */
export function createServer(): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: readVersion() });

  server.registerTool(
    TOOL_NAME,
    { description: TOOL_DESCRIPTION, inputSchema: inputShape, outputSchema: outputShape },
    async (args) => executeSetup(args),
  );

  return server;
}
