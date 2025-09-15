import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { format } from 'date-fns'

if (!process.argv[2]) {
  console.error('Please provide a name for the migration, e.g., "add-users-table"')
  process.exit(1)
}

const migrationDir = resolve(import.meta.dirname, '../src/migrations')
const template = `
import type { Knex } from 'knex'

export async function up(knex: Knex) {
  // Up migration not implemented
}

export async function down(knex: Knex) {
  // Down migration not implemented
}
`
const migrationName = `${format(new Date(), 'yyyyMMddHHmmss')}_${process.argv[2]}.ts`
const migrationPath = resolve(migrationDir, migrationName)

writeFileSync(migrationPath, `${template.trim()}\n`)
