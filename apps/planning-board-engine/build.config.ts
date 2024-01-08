import { join } from 'node:path'
import { defineBuildConfig } from 'unbuild'
import { workspaceExternals } from 'build-utils'

const src = join(__dirname, 'src')

export default defineBuildConfig({
  entries: [{
    builder: 'mkdist',
    input: 'src/',
    outDir: 'dist/',
  }],
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
