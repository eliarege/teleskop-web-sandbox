import type { Knex } from 'knex'
import { config } from '../config'

export function up(knex: Knex) {
  return knex.raw(/* sql */`ALTER DATABASE ${config.teleskopDatabase} SET COMPATIBILITY_LEVEL = 130`)
}

export function down() {
  // no down migration
}
