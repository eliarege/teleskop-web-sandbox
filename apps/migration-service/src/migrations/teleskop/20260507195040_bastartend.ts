import type { Knex } from 'knex'

export async function up(knex: Knex) {
  const hasTable = await knex.schema.hasTable('BASTARTEND')

  if (!hasTable) {
    await knex.schema.createTable('BASTARTEND', (table) => {
      table.bigIncrements('AUTOID')
      table.string('JOBORDER', 50).notNullable()
      table.integer('MACHINEID').notNullable()
      table.tinyint('STATE').notNullable()
      table.datetime('DATE', { precision: 7 }).notNullable()
      table.string('PROGRAMNOLIST', 100).notNullable()
      table.tinyint('TOTALREQUESTCOUNT')
    })
  }
}

export async function down(knex: Knex) {
  const hasTable = await knex.schema.hasTable('BASTARTEND')

  if (hasTable) {
    await knex.schema.dropTable('BASTARTEND')
  }
}
