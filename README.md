# explorer-frontend
Modern Phantasma Explorer frontend (Next.js). This README covers local development and deployment details.

## Quick start (local dev)
Requirements:
- Node.js + npm.
- Optional: `just` for task shortcuts.

```bash
npm install
npm run dev
```

Common tasks:
- `npm run build` (production build)
- `npm run start` (serve production build)
- `npm run lint`
- `npm run test` (Playwright e2e)
- `npm run test:unit` (Vitest unit)

If you use `just`, see the **Justfile** section below.

## Runtime config (public/config.json)
The app loads runtime config from `/public/config.json` **at runtime**.

- For local dev, the repo includes `public/config.json` as a working default.
- For deployments, mount the config file into the container at
  `/app/public/config.json` instead of baking environment-specific values into
  the image.

Example:
```json
{
  "nexus": "mainnet",
  "apiBaseUrl": "https://api-explorer.phantasma.info/api/v1",
  "rpcBaseUrl": "https://pharpc1.phantasma.info/api/v1",
  "explorers": {
    "mainnet": "https://explorer.phantasma.info",
    "testnet": "https://testnet-explorer.phantasma.info",
    "devnet": "https://devnet-explorer.phantasma.info"
  },
  "buildStamp": {
    "enabled": true,
    "label": "dev"
  },
  "diagnostics": {
    "enabled": false
  }
}
```

Config fields:
- `nexus`: `mainnet | testnet | devnet` (drives network switcher + links)
- `apiBaseUrl`: explorer API base URL
- `rpcBaseUrl`: RPC REST base URL for "View RPC API" links (optional override)
- `explorers`: per-network explorer URLs
- `buildStamp.enabled`: show/hide build badge
- `buildStamp.label`: label shown in footer (badge is shown only when **enabled** and the label is non-empty)
- `diagnostics.enabled`: console diagnostics toggle

Notes:
- `buildStamp.time` and `buildStamp.hash` are **not** read from config; they are injected at build time.
- If `rpcBaseUrl` is omitted, the app uses built-in defaults from code:
  - mainnet: `https://pharpc1.phantasma.info/api/v1`
  - testnet: `https://testnet.phantasma.info/api/v1`
  - devnet: `https://devnet.phantasma.info/api/v1`
  If you want a different RPC endpoint (including `pharpc2`), set `rpcBaseUrl` explicitly.

## Build stamp (mandatory)
This project always embeds a build stamp (UTC time + short git hash) at build time.
It is the authoritative way to verify the exact build running in a container.

How it works:
- `scripts/generate-build-info.mjs` writes `src/lib/build-info.ts` on every build.
- `npm run build` triggers `prebuild`, so the stamp is automatic.
- `build-info.ts` is committed so imports resolve, but its contents are overwritten per build.

Important rules:
- **Never** put `buildStamp.time` or `buildStamp.hash` in `public/config.json`.
- Docker Compose requires `BUILD_GIT_SHA` (the compose file enforces it).
  If you are building without Compose, the script can derive the hash from `.git`.

## Version page
`/version` is always available (even when the build stamp is hidden) and shows:
- build time
- git hash
- runtime config values (nexus / apiBaseUrl / diagnostics)

The footer build-stamp badge links to `/version` **only when enabled and labeled**.

## Docker / Podman
Use the files in `docker/` for builds and runs. Copy them into your deployment
stack directory before deploying.

Deployment rules:
1. **Sync** `docker/` from this repo into the deployment stack directory
   (outside the repo). Use the stack's sync script if provided.
2. Provide a runtime config file and mount it to `/app/public/config.json`.
3. Provide `EXPLORER_PORT` and `EXPLORER_CONFIG_PATH` via env or `.env`.
4. Build + run with Docker or Podman.
5. Verify `/version` shows the new build time + hash.

Required env:
- `EXPLORER_PORT` (host port to bind to container `3000`)
- `EXPLORER_CONFIG_PATH` (absolute path to runtime config file)
- `EXPLORER_BUILD_CONTEXT` (optional; defaults to repo root)
- `EXPLORER_DOCKERFILE` (optional; defaults to `docker/Dockerfile`)

Example (conceptual):
```bash
BUILD_GIT_SHA=$(git rev-parse --short HEAD)
docker compose -f docker/docker-compose.yml up -d --build --force-recreate
```

RPC links:
If you don't set `rpcBaseUrl`, the app uses built-in defaults per network
(`pharpc1.phantasma.info`, `testnet.phantasma.info`, `devnet.phantasma.info`).
Override only when you need a custom RPC endpoint (for example, a local chain).

### Deployment checklist
Use this list every time you deploy:
1. Ensure the deployment stack uses the **latest** `docker/` files from this repo.
2. Verify `EXPLORER_CONFIG_PATH` points to the intended config file.
3. Verify `EXPLORER_PORT` is correct and free.
4. Build and restart the container.
5. Open `/version` and confirm the build time + hash match this repo.
6. Smoke-test a block page, transaction page, and `/version`.

### Config examples by network
Mainnet (example):
```json
{
  "nexus": "mainnet",
  "apiBaseUrl": "https://api-explorer.phantasma.info/api/v1",
  "rpcBaseUrl": "https://pharpc1.phantasma.info/api/v1",
  "explorers": {
    "mainnet": "https://explorer.phantasma.info",
    "testnet": "https://testnet-explorer.phantasma.info",
    "devnet": "https://devnet-explorer.phantasma.info"
  },
  "buildStamp": { "enabled": true, "label": "mainnet" },
  "diagnostics": { "enabled": false }
}
```

Testnet (example):
```json
{
  "nexus": "testnet",
  "apiBaseUrl": "https://api-testnet-explorer.phantasma.info/api/v1",
  "rpcBaseUrl": "https://testnet.phantasma.info/api/v1",
  "explorers": {
    "mainnet": "https://explorer.phantasma.info",
    "testnet": "https://testnet-explorer.phantasma.info",
    "devnet": "https://devnet-explorer.phantasma.info"
  },
  "buildStamp": { "enabled": true, "label": "testnet" },
  "diagnostics": { "enabled": false }
}
```

Devnet (example):
```json
{
  "nexus": "devnet",
  "apiBaseUrl": "https://api-devnet-explorer.phantasma.info/api/v1",
  "rpcBaseUrl": "https://devnet.phantasma.info/api/v1",
  "explorers": {
    "mainnet": "https://explorer.phantasma.info",
    "testnet": "https://testnet-explorer.phantasma.info",
    "devnet": "https://devnet-explorer.phantasma.info"
  },
  "buildStamp": { "enabled": true, "label": "devnet" },
  "diagnostics": { "enabled": true }
}
```

Local chain (example):
```json
{
  "nexus": "mainnet",
  "apiBaseUrl": "http://localhost:8000",
  "rpcBaseUrl": "http://localhost:5172/api/v1",
  "explorers": {
    "mainnet": "http://localhost:3000",
    "testnet": "https://testnet-explorer.phantasma.info",
    "devnet": "https://devnet-explorer.phantasma.info"
  },
  "buildStamp": { "enabled": true, "label": "local" },
  "diagnostics": { "enabled": true }
}
```

## Justfile (recommended)
This repo ships with a `justfile` to standardize common tasks.

List tasks:
```bash
just
```

Common targets:
- `just install`, `just build`, `just dev`
- `just lint`, `just test`, `just test-unit`, `just test-e2e`
- `just docker-up`, `just docker-down`, `just docker-logs`
- `just podman-up`, `just podman-down`, `just podman-logs`

`docker-up` / `podman-up` automatically inject `BUILD_GIT_SHA` from the current git HEAD.

## Tests
- `npm run test` (Playwright end-to-end)
- `npm run test:unit` (Vitest unit tests)

## Troubleshooting
- **Build fails with "Set BUILD_GIT_SHA"**: use `just docker-up` or set
  `BUILD_GIT_SHA=$(git rev-parse --short HEAD)` before running Compose.
- **Config not applied**: confirm the container mounts `/app/public/config.json`
  and that the file contents match the intended network/API.
- **Wrong network links**: check `nexus` and `explorers` values in config.
- **No build stamp**: ensure `npm run build` was used and `prebuild` ran.
