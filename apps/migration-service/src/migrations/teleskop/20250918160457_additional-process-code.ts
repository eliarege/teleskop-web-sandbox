import type { Knex } from 'knex'

export async function up(knex: Knex) {
  const bfColumnExists = await knex.schema.hasColumn('BFMASTERPRGHEADER', 'ADDITIONALPROCESSCODE')
  const baColumnExists = await knex.schema.hasColumn('BAMASTERPRGHEADER', 'ADDITIONALPROCESSCODE')

  if (!bfColumnExists) {
    await knex.schema.alterTable('BFMASTERPRGHEADER', (table) => {
      table.integer('ADDITIONALPROCESSCODE').nullable()
    })
  }

  if (!baColumnExists) {
    await knex.schema.alterTable('BAMASTERPRGHEADER', (table) => {
      table.integer('ADDITIONALPROCESSCODE').nullable()
    })
  }
}

export async function down(knex: Knex) {
  const bfColumnExists = await knex.schema.hasColumn('BFMASTERPRGHEADER', 'ADDITIONALPROCESSCODE')
  const baColumnExists = await knex.schema.hasColumn('BAMASTERPRGHEADER', 'ADDITIONALPROCESSCODE')

  if (bfColumnExists) {
    await knex.schema.alterTable('BFMASTERPRGHEADER', (table) => {
      table.dropColumn('ADDITIONALPROCESSCODE')
    })
  }

  if (baColumnExists) {
    await knex.schema.alterTable('BAMASTERPRGHEADER', (table) => {
      table.dropColumn('ADDITIONALPROCESSCODE')
    })
  }
}
