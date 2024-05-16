import type { Knex } from "knex"

export function up(knex: Knex) {
  return knex.schema.table('DISPENSER', (table) => {
    table.dropColumn('is_jdm')
  })
}

export function down(knex: Knex) {
  return knex.schema.table('DISPENSER', (table) => {
    table.boolean('is_jdm').defaultTo(false)
  })
}
