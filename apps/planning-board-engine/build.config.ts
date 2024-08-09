import { join } from 'node:path'
import { defineBuildConfig } from 'unbuild'
import { workspaceExternals } from '@teleskop/build-utils'

const src = join(__dirname, 'src')

export default defineBuildConfig({
  entries: ['src/index'],
  clean: true,
  alias: { '~': src },
  hooks: {
    'build:prepare': (ctx) => {
      workspaceExternals(ctx)
    },
  },
  replace: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})
