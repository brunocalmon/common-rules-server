#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

// The entry point only connects the server to the transport. No logic
// lives here, so nothing the suite covers stays outside of it.
await createServer().connect(new StdioServerTransport());
