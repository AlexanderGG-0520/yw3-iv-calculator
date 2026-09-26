import { parentPort, workerData } from "node:worker_threads";
import { performance } from "node:perf_hooks";
import { reverseSearch } from "../src/engine/reverseSearch";
import type { SearchInput } from "../src/engine/types";

if (!parentPort) {
  throw new Error("reverse-worker must run inside worker_threads.");
}

const testDelayMs = Number(process.env.MCP_TEST_REVERSE_DELAY_MS ?? "0");
if (Number.isFinite(testDelayMs) && testDelayMs > 0) {
  const deadline = performance.now() + testDelayMs;
  while (performance.now() < deadline) {
    // Intentionally burn CPU in the worker thread only. Used by CI to prove
    // the HTTP event loop remains responsive during a heavy reverse search.
  }
}

try {
  const response = reverseSearch(workerData as SearchInput);
  parentPort.postMessage({ ok: true, response });
} catch (error) {
  parentPort.postMessage({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  });
}
