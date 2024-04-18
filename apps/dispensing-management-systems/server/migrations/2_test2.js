export function up(knex) {
  return knex.schema
    .createTable('customers', (table) => {
      table.increments('id')
      table.string('first_name', 255).notNullable()
      table.string('last_name', 255).notNullable()
    })
    .createTable('purchases', (table) => {
      table.increments('id')
      table.decimal('price').notNullable()
      table.string('name', 1000).notNullable()
    })
}

export function down(knex) {
  return knex.schema.dropTable('purchases').dropTable('customers')
}
