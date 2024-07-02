import { join } from 'node:path'
import { defineBuildConfig } from 'unbuild'
import { inlineWorkspaceDependencies } from '@teleskop/build-utils'

const src = join(__dirname, 'src')

export default defineBuildConfig({
  entries: ['src/index'],
  clean: true,
  alias: { '~': src },
  hooks: {
    'build:prepare': (ctx) => {
      inlineWorkspaceDependencies(ctx)
    },
  },
  replace: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})
