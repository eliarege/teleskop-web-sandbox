import type { Knex } from 'knex'

export async function up(knex: Knex) {
  const alarmsHasShowColumn = await knex.schema.hasColumn('BFMASTERCOMMANDSALARMS', 'SHOWONSCREEN')

  if (!alarmsHasShowColumn) {
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
  await knex.schema.alterTable('BFMASTERCOMMANDSALARMS', (table) => {
    table.dropColumn('SHOWONSCREEN')
  })
}
