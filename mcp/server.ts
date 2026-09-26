import { createServer } from "node:http";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { getReverseWorkerPoolStats } from "./calculator";
import { registerCalculatorTools } from "./tools";

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? "3001");

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new RangeError("PORT must be an integer from 1 through 65535.");
}

const handler = createMcpHandler(() => {
  const server = new McpServer({
    name: "yw3-iv-calculator",
    version: "0.1.0",
  });
  registerCalculatorTools(server);
  return server;
});

const nodeHandler = toNodeHandler(handler);

const httpServer = createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");

  if (url.pathname === "/healthz") {
    response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    response.end("ok\n");
    return;
  }

  if (
    process.env.MCP_TEST_EXPOSE_DEBUG === "1" &&
    url.pathname === "/_test/reverse-pool"
  ) {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(getReverseWorkerPoolStats()));
    return;
  }

  if (url.pathname === "/mcp" || url.pathname === "/mcp/") {
    void nodeHandler(request, response);
    return;
  }

  response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  response.end("not found\n");
});

httpServer.listen(port, host, () => {
  console.log("YW3 IV Calculator MCP listening on " + host + ":" + port);
});

async function shutdown(signal: string) {
  console.log("Received " + signal + "; shutting down.");
  httpServer.close();
  await handler.close();
}

process.once("SIGTERM", () => {
  void shutdown("SIGTERM").finally(() => process.exit(0));
});
process.once("SIGINT", () => {
  void shutdown("SIGINT").finally(() => process.exit(0));
});
