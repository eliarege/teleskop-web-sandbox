# Repository Details

This repository is a pnpm monorepo. It uses TypeScript for all source files.
Apps are located in the `apps/` directory, and packages are located in the `packages/` directory. Apps are usually nuxt (3.x) projects. All nuxt projects extend on `packages/nuxt-base` which contains shared configuration and code. You can detect if app is a nuxt project if it has a `nuxt.config.ts` file in its root. Uses `knex` as query builder for SQL Server and Postgres databases.

# Commit messages

After editing any files, always propose a conventional commit message summarising the changes.

Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Allowed types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Rules:**
- Use the imperative, present tense: "add feature" not "added feature".
- Keep the description under 72 characters.
- Reference issue or ticket numbers in the footer when relevant (e.g. `Closes #123`).
- Write scopes according to table below

| Scope      | Application                     |
| ---------- | ------------------------------- |
| AR         | `archive`                       |
| DM         | `dispensing-manager-ui`         |
| MS         | `machine-status`                |
| MA         | `machines`                      |
| MM         | `multi-monitor`                 |
| PB         | `planning-board`                |
| PB         | `planning-board-engine`         |
| PE         | `program-editor`                |
| RE         | `recipes`                       |
| migrations | `migration-service`             |

Other apps and packages should always use full name for scopes.
