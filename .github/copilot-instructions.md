# Project Guidelines

## Architecture

pnpm monorepo managed with Turborepo. All source files use **TypeScript**.

- `apps/` — Nuxt 3 UI apps, Fastify server apps, and utility services
- `packages/` — Shared libraries under the `@teleskop/*` scope

**Nuxt apps** contain a `nuxt.config.ts` and are CSR-only (SSR disabled). They all extend `packages/nuxt-base`, which provides shared config for: Quasar (UI components), UnoCSS (atomic CSS), Pinia (state), VueUse, and i18n (en-GB, tr, pt). Element Plus is available but the project is **migrating away from it** — prefer Quasar components for new code.

**Fastify server apps** (e.g. `iovalues-server`, `machine-status`, `planning-board-engine`, `communication-driver`) use Pino for logging and `@teleskop/keycloak-adapter` for auth. They are compiled with **unbuild** (`build.config.ts`).

## Code Conventions

Nuxt app internal structure:

- `pages/` — Nuxt file-based routes
- `components/` — Vue components
- `composables/` — Vue composables
- `stores/` — Pinia stores (naming: `use<Name>Store`)
- `server/api/` — Nitro server API routes; use `defineAuthEventHandler` for authenticated endpoints (supports optional `roles` array for RBAC)
- `server/services/` — Server-side service logic
- `shared/` — Types, enums, and constants shared between client and server

Database access via **knex** (SQL Server with `tedious`, Postgres with `pg`). Exception: `apps/machine-status` uses **kysely**.

Tests use **vitest**.
