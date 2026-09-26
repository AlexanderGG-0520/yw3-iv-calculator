const base = "http://127.0.0.1:3001";

function reverseCall(id) {
  return fetch(base + "/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "accept": "application/json, text/event-stream",
      "mcp-protocol-version": "2025-06-18",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: {
        name: "reverse_iv",
        arguments: {
          species: "ジバニャン",
          level: 50,
          rankUps: 4,
          observed: {
            hp: 254,
            strength: 145,
            spirit: 33,
            defense: 64,
            speed: 156
          },
          sessions: {
            strength: 5,
            spirit: 0,
            defense: 0,
            speed: 0
          },
          scoreProfile: "healer",
          maxResults: 20
        }
      }
    })
  }).then(async (response) => {
    const body = await response.text();
    if (!response.ok) {
      throw new Error("reverse_iv HTTP failure: " + response.status + " " + body);
    }
    return body;
  });
}

const parallel = Array.from({ length: 6 }, (_, index) => reverseCall(index + 10));

await new Promise((resolve) => setTimeout(resolve, 250));

const healthStarted = performance.now();
const health = await fetch(base + "/healthz");
const healthElapsed = performance.now() - healthStarted;
if (!health.ok || (await health.text()).trim() !== "ok") {
  throw new Error("healthz failed during parallel reverse_iv requests.");
}
if (healthElapsed > 750) {
  throw new Error(
    "healthz was blocked for " + Math.round(healthElapsed) + "ms during parallel reverse_iv.",
  );
}

const poolResponse = await fetch(base + "/_test/reverse-pool");
if (!poolResponse.ok) {
  throw new Error("reverse-pool debug endpoint failed.");
}
const pool = await poolResponse.json();

if (pool.active !== 1) {
  throw new Error("expected exactly one active worker, got " + pool.active);
}
if (pool.queued !== 0) {
  throw new Error("expected no queue, got " + pool.queued);
}
if (pool.maxConcurrent !== 1 || pool.maxActiveObserved !== 1) {
  throw new Error("worker concurrency was not bounded to one: " + JSON.stringify(pool));
}
if (pool.rejectedBusy < 1) {
  throw new Error("parallel overflow requests were not rejected as busy.");
}

const bodies = await Promise.all(parallel);
const successes = bodies.filter((body) => body.includes('"results"')).length;
const busy = bodies.filter(
  (body) => body.includes('"isError":true') && body.includes("reverse_iv is busy"),
).length;

if (successes !== 1) {
  throw new Error("expected one successful reverse_iv, got " + successes);
}
if (busy !== 5) {
  throw new Error("expected five busy reverse_iv responses, got " + busy);
}

console.log(
  "parallel reverse_iv bounded correctly: " +
    JSON.stringify({ healthElapsedMs: Math.round(healthElapsed), pool, successes, busy }),
);
