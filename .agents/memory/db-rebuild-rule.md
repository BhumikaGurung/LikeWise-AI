---
name: DB rebuild rule
description: Required sequence after changing any lib/* schema or package.
---

# DB Rebuild Rule

**Rule:** After any change to `lib/db/src/schema/` or any other `lib/*` package, always run `pnpm run typecheck:libs` before checking leaf artifact types, and `pnpm --filter @workspace/db run push` to apply schema changes.

**Why:** TypeScript project references mean the lib declarations must be rebuilt for artifact packages to see the new types. The DB push step applies the DDL changes to the actual Postgres instance.

**How to apply:**
1. Write schema changes to `lib/db/src/schema/*.ts`
2. Export from `lib/db/src/schema/index.ts`
3. `pnpm run typecheck:libs` — rebuilds all lib declarations
4. `pnpm --filter @workspace/db run push` — applies schema to DB
5. `pnpm --filter @workspace/api-spec run codegen` — if OpenAPI spec also changed
6. Then check artifact typechecks: `pnpm --filter @workspace/api-server run typecheck`

Skipping step 3 causes TS2305 "module has no exported member" errors in artifact packages.
