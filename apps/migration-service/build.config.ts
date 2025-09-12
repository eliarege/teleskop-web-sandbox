import { basename, extname, join, resolve } from 'node:path'
import { readdirSync } from 'node:fs'
import { defineBuildConfig } from 'unbuild'
import { workspaceExternals } from '@teleskop/build-utils'
import virtual from '@rollup/plugin-virtual'
import type { InputPluginOption } from 'rollup'

const src = join(__dirname, 'src')
const migrationDir = join(src, 'migrations')
const migrations = readdirSync(migrationDir, { withFileTypes: true })
  .filter(file => file.isFile())
  .map(file => file.name)
  .sort((a, b) => a.localeCompare(b))

function getMigrationName(name: string) {
  return `_${basename(name, extname(name)).replace(/[^a-zA-Z0-9_$]/g, '_')}`
}

export default defineBuildConfig({
  entries: ['src/migrate'],
  clean: true,
  alias: { '~': src },
  outDir: 'dist',
  hooks: {
    'rollup:options': function (_, options) {
      const plugins = options.plugins as InputPluginOption[]
      plugins.push(
        virtual({
          '#migrations': `\
${migrations.map((m) => {
  return `import * as ${getMigrationName(m)} from '${resolve(migrationDir, m)}'`
}).join('\n')}

const migrationNames = [ ${migrations.map(getMigrationName).map(n => `'${n}'`).join(', ')} ]
const migrations = { ${migrations.map(getMigrationName)} }

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
}`,

        }),
      )
    },
    'build:prepare': (ctx) => {
      workspaceExternals(ctx)
    },
  },
  replace: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})
