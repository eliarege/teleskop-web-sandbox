declare module '#migrations/teleskop' {
  import type { Knex } from 'knex'

  export const RollupMigrationSource: {
    new (): Knex.MigrationSource<string>
  }
}

declare module '#migrations/dmexchange' {
  import type { Knex } from 'knex'

  export const RollupMigrationSource: {
    new (): Knex.MigrationSource<string>
  }
}
