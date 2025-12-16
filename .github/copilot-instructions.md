# Repository Details

This repository is a pnpm monorepo. It uses TypeScript for all source files.
Apps are located in the `apps/` directory, and packages are located in the `packages/` directory. Apps are usually nuxt (3.x) projects. All nuxt projects extend on `packages/nuxt-base` which contains shared configuration and code. You can detect if app is a nuxt project if it has a `nuxt.config.ts` file in its root. Uses `knex` as query builder for SQL Server and Postgres databases.
