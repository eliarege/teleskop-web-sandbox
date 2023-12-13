import { join } from 'node:path'
import { defineBuildConfig } from 'unbuild'

const src = join(process.cwd(), 'src')

export default defineBuildConfig({
  entries: [{
    builder: 'mkdist',
    input: 'src/',
    outDir: 'dist/',
  }],
  clean: true,
  alias: { '~': src },
  replace: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})
