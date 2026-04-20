import type { Knex } from 'knex'
import { legacyMigration_3_4_05_0 } from './legacy-migrations/3_4_05_0'
import { legacyMigration_3_4_06_0 } from './legacy-migrations/3_4_06_0'
import { legacyMigration_3_4_07_0 } from './legacy-migrations/3_4_07_0'
import { legacyMigration_3_4_08_0 } from './legacy-migrations/3_4_08_0'
import { legacyMigration_3_4_09_0 } from './legacy-migrations/3_4_09_0'
import { legacyMigration_3_4_10_0 } from './legacy-migrations/3_4_10_0'
import { legacyMigration_3_4_11_0 } from './legacy-migrations/3_4_11_0'
import { legacyMigration_3_4_12_0 } from './legacy-migrations/3_4_12_0'
import { legacyMigration_3_4_13_0 } from './legacy-migrations/3_4_13_0'
import { legacyMigration_3_4_14_0 } from './legacy-migrations/3_4_14_0'
import { legacyMigration_3_4_15_0 } from './legacy-migrations/3_4_15_0'
import { legacyMigration_3_4_16_0 } from './legacy-migrations/3_4_16_0'
import { legacyMigration_3_4_17_0 } from './legacy-migrations/3_4_17_0'
import { legacyMigration_3_4_18_0 } from './legacy-migrations/3_4_18_0'
import { legacyMigration_3_4_19_0 } from './legacy-migrations/3_4_19_0'
import { legacyMigration_3_4_20_0 } from './legacy-migrations/3_4_20_0'
import { legacyMigration_3_4_21_0 } from './legacy-migrations/3_4_21_0'
import { legacyMigration_3_4_22_0 } from './legacy-migrations/3_4_22_0'
import { legacyMigration_3_4_23_0 } from './legacy-migrations/3_4_23_0'
import { legacyMigration_3_4_24_0 } from './legacy-migrations/3_4_24_0'
import { legacyMigration_3_4_25_0 } from './legacy-migrations/3_4_25_0'
import { legacyMigration_3_4_26_0 } from './legacy-migrations/3_4_26_0'
import { legacyMigration_3_4_27_0 } from './legacy-migrations/3_4_27_0'
import { legacyMigration_3_4_28_0 } from './legacy-migrations/3_4_28_0'
import { legacyMigration_3_4_29_0 } from './legacy-migrations/3_4_29_0'
import { legacyMigration_3_4_30_0 } from './legacy-migrations/3_4_30_0'
import { legacyMigration_3_4_31_0 } from './legacy-migrations/3_4_31_0'
import { legacyMigration_3_4_32_0 } from './legacy-migrations/3_4_32_0'

type Version = [number, number, number, number]

function parseVersion(version: string): Version {
  const parts = version.trim().split('.').map(Number)
  if (parts.length !== 4 || parts.some(Number.isNaN)) {
    throw new Error(`Invalid DB version format: "${version}"`)
  }
  return parts as Version
}

function compareVersions(a: Version, b: Version): number {
  for (let i = 0; i < 4; i++) {
    if (a[i] !== b[i])
      return a[i]! - b[i]!
  }
  return 0
}

function versionToString(version: Version): string {
  return version.join('.')
}

const MIN_SUPPORTED_VERSION: Version = [3, 4, 4, 0]

const LEGACY_MIGRATIONS: Array<{ version: Version, fn: (knex: Knex) => Promise<void> }> = [
  { version: [3, 4, 5, 0], fn: legacyMigration_3_4_05_0 },
  { version: [3, 4, 6, 0], fn: legacyMigration_3_4_06_0 },
  { version: [3, 4, 7, 0], fn: legacyMigration_3_4_07_0 },
  { version: [3, 4, 8, 0], fn: legacyMigration_3_4_08_0 },
  { version: [3, 4, 9, 0], fn: legacyMigration_3_4_09_0 },
  { version: [3, 4, 10, 0], fn: legacyMigration_3_4_10_0 },
  { version: [3, 4, 11, 0], fn: legacyMigration_3_4_11_0 },
  { version: [3, 4, 12, 0], fn: legacyMigration_3_4_12_0 },
  { version: [3, 4, 13, 0], fn: legacyMigration_3_4_13_0 },
  { version: [3, 4, 14, 0], fn: legacyMigration_3_4_14_0 },
  { version: [3, 4, 15, 0], fn: legacyMigration_3_4_15_0 },
  { version: [3, 4, 16, 0], fn: legacyMigration_3_4_16_0 },
  { version: [3, 4, 17, 0], fn: legacyMigration_3_4_17_0 },
  { version: [3, 4, 18, 0], fn: legacyMigration_3_4_18_0 },
  { version: [3, 4, 19, 0], fn: legacyMigration_3_4_19_0 },
  { version: [3, 4, 20, 0], fn: legacyMigration_3_4_20_0 },
  { version: [3, 4, 21, 0], fn: legacyMigration_3_4_21_0 },
  { version: [3, 4, 22, 0], fn: legacyMigration_3_4_22_0 },
  { version: [3, 4, 23, 0], fn: legacyMigration_3_4_23_0 },
  { version: [3, 4, 24, 0], fn: legacyMigration_3_4_24_0 },
  { version: [3, 4, 25, 0], fn: legacyMigration_3_4_25_0 },
  { version: [3, 4, 26, 0], fn: legacyMigration_3_4_26_0 },
  { version: [3, 4, 27, 0], fn: legacyMigration_3_4_27_0 },
  { version: [3, 4, 28, 0], fn: legacyMigration_3_4_28_0 },
  { version: [3, 4, 29, 0], fn: legacyMigration_3_4_29_0 },
  { version: [3, 4, 30, 0], fn: legacyMigration_3_4_30_0 },
  { version: [3, 4, 31, 0], fn: legacyMigration_3_4_31_0 },
  { version: [3, 4, 32, 0], fn: legacyMigration_3_4_32_0 },
]

export async function up(knex: Knex) {
  const row = await knex('TFDBVERSION').select('DBVERSION').first<{ DBVERSION: string } | undefined>()

  // Fresh installation — no legacy DB to migrate
  if (!row) {
    throw new Error('DBVERSION entry not found. Cannot perform legacy migrations on an uninitialized database.')
  }

  const currentVersion = parseVersion(row.DBVERSION)

  if (compareVersions(currentVersion, MIN_SUPPORTED_VERSION) < 0) {
    throw new Error(
      `DB version ${versionToString(currentVersion)} cannot be migrated. Minimum supported version is ${versionToString(MIN_SUPPORTED_VERSION)}.`,
    )
  }

  const migrationsToRun = LEGACY_MIGRATIONS.filter(
    m => compareVersions(m.version, currentVersion) > 0,
  )

  if (migrationsToRun.length === 0)
    return

  for (const migration of migrationsToRun) {
    await migration.fn(knex)
  }

  const finalVersion = versionToString(migrationsToRun[migrationsToRun.length - 1]!.version)
  await knex('TFDBVERSION').update({ DBVERSION: finalVersion })
}

export async function down(_knex: Knex) {
  // No rollback needed
}
