# Remote MCP server

The calculator exposes the same Yo-kai Watch 3 calculation engine as a public, read-only Remote MCP server.

## Endpoint

After deployment, use the website origin with the `/mcp` path:

```text
https://<site-host>/mcp
```

The endpoint uses MCP Streamable HTTP. It is stateless and does not require authentication because every exposed operation is a pure calculator/data lookup with no user data or consequential side effects.

## Tools

| Tool | Purpose |
| --- | --- |
| `search_yokai` | Search the built-in species dataset by Japanese name, internal id, or encyclopedia number. |
| `list_evaluation_profiles` | List the 25 IV ranking profiles and role descriptions. |
| `calculate_stats` | Forward-calculate stats from species, level, IVs, Sports Club, rank-up count, and equipment. |
| `reverse_iv` | Reverse-calculate IV candidates and rank them using a selected role/profile. |

All tools use the same checked-in species data and calculation modules as the web calculator.

### Availability limits

`reverse_iv` is CPU- and memory-intensive, so the public MCP process allows **one reverse search at a time**. Additional concurrent `reverse_iv` calls are rejected immediately with a busy error and should be retried shortly. No unbounded request queue is kept.

The reverse worker also uses Node `worker_threads.resourceLimits` to cap its V8 heap in addition to the Kubernetes container memory limit.

## ChatGPT

In ChatGPT developer mode, add a custom MCP/plugin connection whose server URL is:

```text
https://<site-host>/mcp
```

No OAuth credentials are required for this server.

## OpenAI API

Remote MCP can also be supplied to the Responses API as an MCP tool using the same public `server_url`.

## Local testing

Build and run the MCP server:

```sh
npm ci
npm run build:mcp
HOST=127.0.0.1 PORT=3001 node dist-mcp/server.mjs
```

Health check:

```sh
curl http://127.0.0.1:3001/healthz
```

For protocol-level inspection, use the MCP Inspector with Streamable HTTP and `http://127.0.0.1:3001/mcp`.

## Deployment

Production runs the MCP process as a sidecar in the same Kubernetes Pod as the nginx web frontend. nginx proxies public `/mcp` traffic to `127.0.0.1:3001`, so the existing public website hostname and Cloudflare routing can be reused without exposing another Service port.

The MCP image is published separately as:

```text
ghcr.io/alexandergg-0520/yw3-iv-calculator-mcp:<commit SHA>
```

Both web and MCP image tags are updated atomically by the GitOps publish workflow after a successful main build.
