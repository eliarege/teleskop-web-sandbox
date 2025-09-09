declare module '#pt-migrations' {
  import type { Knex } from 'knex'

  export const PtMigrationSource: Knex.MigrationSource<string>
}
