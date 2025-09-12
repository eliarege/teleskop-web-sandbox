declare module '#migrations' {
  import type { Knex } from 'knex'

  export const RollupMigrationSource: {
    new (): Knex.MigrationSource<string>
  }
}
