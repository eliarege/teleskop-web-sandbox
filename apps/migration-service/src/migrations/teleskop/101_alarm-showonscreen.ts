import type { Knex } from 'knex'
import { config } from '../../config'

export async function up(knex: Knex) {
  if (!config.enableLegacyMigrations) {
    return
  }

  const hasColumn = await knex.schema.hasColumn('BFMASTERCOMMANDSALARMS', 'SHOWONSCREEN')

  if (!hasColumn) {
    await knex.schema.alterTable('BFMASTERCOMMANDSALARMS', (table) => {
      table.boolean('SHOWONSCREEN').defaultTo(true)
    })
  } else {
    await knex.schema.alterTable('BFMASTERCOMMANDSALARMS', (table) => {
      table.boolean('SHOWONSCREEN').alter().defaultTo(true)
    })
  }

  await knex('BFMASTERCOMMANDSALARMS')
    .update({ SHOWONSCREEN: true })
    .where('SHOWONSCREEN', null)
}

export async function down(knex: Knex) {
  if (!config.enableLegacyMigrations) {
    return
  }
  const hasColumn = await knex.schema.hasColumn('BFMASTERCOMMANDSALARMS', 'SHOWONSCREEN')
  if (hasColumn) {
    await knex.schema.alterTable('BFMASTERCOMMANDSALARMS', (table) => {
      table.dropColumn('SHOWONSCREEN')
    })
  }
}
