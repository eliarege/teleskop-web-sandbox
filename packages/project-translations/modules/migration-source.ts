import { basename, extname, resolve } from 'node:path'
import fsp from 'node:fs/promises'
import { defineNuxtModule } from '@nuxt/kit'
import type { InputPluginOption } from 'rollup'
import virtual from '@rollup/plugin-virtual'

export default defineNuxtModule({
  async setup(_, nuxt) {
    const migrationDir = resolve(import.meta.dirname, '../server/migrations')
    const migrations = await fsp.readdir(migrationDir)

    const getMigrationName = (name: string) => `_${basename(name, extname(name)).replace(/[^a-zA-Z0-9_$]/g, '_')}`

    nuxt.options.nitro.rollupConfig ??= {}
    nuxt.options.nitro.rollupConfig.plugins ??= []
    const plugins = nuxt.options.nitro.rollupConfig.plugins as InputPluginOption[]
    plugins.push(virtual({
      '#pt-migrations': `\
${migrations.map((m) => {
  return `import * as ${getMigrationName(m)} from '${resolve(migrationDir, m)}'`
}).join('\n')}
const migrations = { ${migrations.map(getMigrationName)} }

export const PtMigrationSource = {
  getMigrations() {
    return Promise.resolve(Object.keys(migrations));
  },

  getMigrationName(migration) {
    return migration;
  },

  getMigration(migration) {
    return migrations[migration];
  }
}
      `,
    }))
  },
})
