import { join } from 'node:path'
import { defineBuildConfig } from 'unbuild'
import { inlineWorkspaceDependencies } from '@teleskop/build-utils'

const src = join(__dirname, 'src')

export default defineBuildConfig({
  entries: ['src/server'],
  clean: true,
  alias: { '~': src },
  outDir: 'dist',
  hooks: {
    'build:prepare': (ctx) => {
      inlineWorkspaceDependencies(ctx)
    },
  },
  replace: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})
