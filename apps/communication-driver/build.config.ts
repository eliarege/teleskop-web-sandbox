import { join } from 'node:path'
import { workspaceExternals } from '@teleskop/build-utils'
import { defineBuildConfig } from 'unbuild'

const src = join(__dirname, 'src')

export default defineBuildConfig({
  entries: ['src/server'],
  clean: true,
  alias: { '~': src },
  outDir: 'dist',
  hooks: {
    'build:prepare': (ctx) => {
      workspaceExternals(ctx)
    },
  },
  replace: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})
