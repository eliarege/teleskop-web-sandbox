declare module '#migration-source' {
  import type { Knex } from 'knex'

  export const MigrationSource: Knex.MigrationSource<string>
}
