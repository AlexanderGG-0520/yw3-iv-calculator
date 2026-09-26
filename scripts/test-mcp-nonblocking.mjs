const base = "http://127.0.0.1:3001";

const reverseRequest = fetch(base + "/mcp", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "accept": "application/json, text/event-stream",
    "mcp-protocol-version": "2025-06-18",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 2,
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
    throw new Error("reverse_iv failed: " + response.status + " " + body);
  }
  if (!body.includes('"results"')) {
    throw new Error("reverse_iv response did not contain results: " + body);
  }
});

await new Promise((resolve) => setTimeout(resolve, 250));

const started = performance.now();
const health = await fetch(base + "/healthz");
const elapsed = performance.now() - started;
const healthBody = await health.text();

if (!health.ok || healthBody.trim() !== "ok") {
  throw new Error("healthz failed while reverse_iv was running.");
}

if (elapsed > 750) {
  throw new Error(
    "healthz was blocked for " + Math.round(elapsed) + "ms during reverse_iv.",
  );
}

await reverseRequest;
console.log(
  "healthz stayed responsive during reverse_iv (" + Math.round(elapsed) + "ms).",
);
