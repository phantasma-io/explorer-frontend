# explorer-frontend
Live insight into blocks, transactions, tokens, and NFTs.

## Build stamp (mandatory)
This project **always** embeds a build stamp (UTC time + short git hash) into the code at build time.
It is used to verify deployed versions quickly and to prevent accidental “stale” deployments.

How it works:
- `scripts/generate-build-info.mjs` writes `src/lib/build-info.ts` **on every build**.
- `npm run build` triggers `prebuild`, so the stamp is **automatic**.
- `build-info.ts` is tracked in git as a placeholder and is overwritten during builds.

Important rules:
- **Never** put `buildStamp.time` in `public/config.json`.  
  The time/hash are injected into code, config only controls visibility.
- Always provide `BUILD_GIT_SHA` when building via Docker (short hash, 7 chars).
  If missing, the build must fail so it can’t be forgotten.

## Runtime config (public/config.json)
Runtime config is loaded from `/public/config.json` at runtime.
Only user-toggled values should live here (e.g. build-stamp visibility/label).

Example:
```json
{
  "nexus": "mainnet",
  "apiBaseUrl": "https://api-explorer.phantasma.info/api/v1",
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

## Version page
`/version` is always available (even when the build stamp is hidden) and shows:
- build time
- git hash
- runtime config values (nexus / apiBaseUrl / diagnostics)

The footer build-stamp badge links to `/version` **only when enabled**.

## Docker / deployment workflow (generic)
Use the files in `docker/` as the single source of truth for Docker builds.

Requirements:
- `BUILD_GIT_SHA` must be set in the build environment.
- Config should be mounted to `/app/public/config.json`.

Example build/run (conceptual):
```bash
BUILD_GIT_SHA=$(git rev-parse --short HEAD)
docker compose --env-file .env -f docker/docker-compose.yml up -d --build --force-recreate
```

**Always verify** after deploy:
- container restarted
- `/version` reflects the new build time + hash
