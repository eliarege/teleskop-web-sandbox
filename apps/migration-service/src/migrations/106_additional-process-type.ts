import type { Knex } from 'knex'

export async function up(knex: Knex) {
  const bfColumns = await knex('BFMASTERPRGHEADER').columnInfo()
  const baColumns = await knex('BAMASTERPRGHEADER').columnInfo()

  console.log(bfColumns, baColumns)

  if (!bfColumns.ADDITIONALPROCESSTYPE) {
    await knex.schema.alterTable('BFMASTERPRGHEADER', (table) => {
      table.integer('ADDITIONALPROCESSTYPE').nullable()
    })
  }

  if (!baColumns.ADDITIONALPROCESSTYPE) {
    await knex.schema.alterTable('BAMASTERPRGHEADER', (table) => {
      table.integer('ADDITIONALPROCESSTYPE').nullable()
    })
  }
}

export async function down(knex: Knex) {
  const bfColumns = await knex('BFMASTERPRGHEADER').columnInfo()
  const baColumns = await knex('BAMASTERPRGHEADER').columnInfo()

  if (bfColumns.ADDITIONALPROCESSTYPE) {
    await knex.schema.alterTable('BFMASTERPRGHEADER', (table) => {
      table.dropColumn('ADDITIONALPROCESSTYPE')
    })
  }

  if (baColumns.ADDITIONALPROCESSTYPE) {
    await knex.schema.alterTable('BAMASTERPRGHEADER', (table) => {
      table.dropColumn('ADDITIONALPROCESSTYPE')
    })
  }
}
