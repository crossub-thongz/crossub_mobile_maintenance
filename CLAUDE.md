# CROSSUB Maintenance (Contractor) App — CLAUDE.md

The CROSSUB maintenance/contractor mobile-web app (Next.js 16; the app is in
`apps/maintenance/`). One of five role apps; the others and the backend are **sibling
repos** under `~/Desktop/crossub/`.

## The API contract is the source of truth

Talk to the backend through the **published contract**, never hand-written types:

- Package: **`@crossub-thongz/api-contract`** — generated from the NestJS API's OpenAPI
  (`openapi.mobile.json`, the `/api/v1` facades).
- Typed client: `apps/maintenance/lib/crossub-api/client.ts` — `createCrossubClient`
  (openapi-fetch, base `/api/v1`, cookie session via `credentials: 'include'`).
- This app's facade is **`/api/v1/contractor/*`** — jobs, accept/complete, quotes, photos.
  Add calls in `apps/maintenance/lib/crossub-api/contractor-client.ts` using the `crossub`
  client + `components['schemas'][...]` types. **Never hand-roll request/response types.**
- Legacy `lib/crossub-api/maintenance-client.ts` still calls the non-v1 `/maintenance/*`
  staff endpoints — migrate it onto the `/contractor/*` facade over time.

## Where things live (sibling repos under `~/Desktop/crossub/`)

- **Backend (NestJS):** `crossub_web/apps/api` — the contractor facade is `/api/v1/contractor/*`.
- **Contract source:** `crossub_web/packages/api-contract` — wired into this session via
  `.claude/settings.json` → `additionalDirectories`, so the live contract types are in
  context without opening the whole backend or the other apps.

## Auth & data flow

- Cookie session (`csb_at`) via `/auth/login`; every call goes through the BFF proxy
  `apps/maintenance/app/api/[...path]/route.ts` → `API_INTERNAL_URL`.
