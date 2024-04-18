export function up(knex) {
  return knex.schema.table('DISPENSER', (table) => {
    table.dropColumn('is_jdm')
  })
}

export function down(knex) {
  return knex.schema.table('"DISPENSER"', (table) => {
    table.boolean('is_jdm').defaultTo(false)
  })
}
