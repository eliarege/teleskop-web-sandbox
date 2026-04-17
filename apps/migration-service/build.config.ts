import { join } from 'node:path'
import { defineBuildConfig } from 'unbuild'
import { workspaceExternals } from '@teleskop/build-utils'
import virtual from '@rollup/plugin-virtual'
import type { InputPluginOption } from 'rollup'
import { buildMigrationVirtualModule, sqlLoader } from './build/migrations'

const src = join(__dirname, 'src')
const migrationDir = join(src, 'migrations')

export default defineBuildConfig({
  entries: ['src/migrate'],
  clean: true,
  alias: { '~': src },
  outDir: 'dist',
  hooks: {
    'rollup:options': function (_, options) {
      const plugins = options.plugins as InputPluginOption[]
      plugins.unshift(sqlLoader())
      plugins.push(
        virtual({
          '#migrations/teleskop': buildMigrationVirtualModule(join(migrationDir, 'teleskop')),
          '#migrations/dmexchange': buildMigrationVirtualModule(join(migrationDir, 'dmexchange')),
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
