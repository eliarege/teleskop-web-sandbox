import type { Knex } from 'knex'
import { Unit } from '../../shared/enums'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('COMPANY_INFO', (table) => {
    table.boolean('part_count_active').defaultTo(false)
    table.integer('default_unit_type_dye').notNullable().defaultTo(Unit.Percent)
    table.integer('default_unit_type_chem').notNullable().defaultTo(Unit.GramPerLiter)
    table.string('part_count_column', 20).nullable()
  })

  await knex('COMPANY_INFO').update({
    default_unit_type_dye: Unit.Percent,
    default_unit_type_chem: Unit.GramPerLiter,
  })

  await knex.schema.alterTable('BATCH_PLAN', (table) => {
    table.integer('part_count').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('COMPANY_INFO', (table) => {
    table.dropColumn('part_count_active')
    table.dropColumn('default_unit_type_dye')
    table.dropColumn('default_unit_type_chem')
    table.dropColumn('part_count_column')
  })

  await knex.schema.alterTable('BATCH_PLAN', (table) => {
    table.dropColumn('part_count')
  })
}
