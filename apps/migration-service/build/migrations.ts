import { basename, extname, resolve } from 'node:path'
import { readFileSync, readdirSync } from 'node:fs'
import type { Plugin } from 'rollup'

// NEVER CHANGE THE IMPLEMENTATION OF THIS FUNCTION, IT IS USED TO GENERATE THE MIGRATION NAMES
function getMigrationName(name: string): string {
  return `_${basename(name, extname(name)).replace(/[^a-zA-Z0-9_$]/g, '_')}`
}

export function sqlLoader(): Plugin {
  return {
    name: 'sql-loader',
    load(id) {
      if (!id.endsWith('.sql')) return null

      const sql = readFileSync(id, 'utf-8')
      const dbEnv = id.includes('/dmexchange/')
        ? `process.env.DMEXCHANGE_DATABASE || process.env.NUXT_DMEXCHANGE_DATABASE`
        : `process.env.TELESKOP_DATABASE || process.env.NUXT_TELESKOP_DATABASE`

      return {
        code: `
export async function up(knex) {
  const dbName = ${dbEnv};
  const sql = ${JSON.stringify(sql.replace(/\?/g, '\\?'))};
  return knex.raw(\`USE \${dbName};\n\n\${sql}\`);
}

export async function down(knex) {
  throw new Error('SQL migrations do not support rollback');
}
`,
        map: null,
      }
    },
  }
}

export function buildMigrationVirtualModule(dir: string): string {
  const files = readdirSync(dir, { withFileTypes: true })
    .filter(f => f.isFile())
    .filter(f => ['.ts', '.sql'].includes(extname(f.name)))
    .map(f => f.name)
    .sort((a, b) => a.localeCompare(b))

  const names = files.map(getMigrationName)

  return `\
${files.map(m => `import * as ${getMigrationName(m)} from '${resolve(dir, m)}'`).join('\n')}

const migrationNames = [ ${names.map(n => `'${n}'`).join(', ')} ]
const migrations = { ${names.join(', ')} }

export class RollupMigrationSource {
  getMigrations() {
    return Promise.resolve(migrationNames);
  }

  getMigrationName(migration) {
    return migration;
  }

  getMigration(migration) {
    return migrations[migration];
  }
}`
}
