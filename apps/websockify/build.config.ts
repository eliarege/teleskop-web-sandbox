import { join } from 'node:path'
import process from 'node:process'
import { defineBuildConfig } from 'unbuild'

const src = join(process.cwd(), 'src')

export default defineBuildConfig({
  entries: ['src/server'],
  clean: true,
  alias: { '~': src },
  outDir: 'dist',
  replace: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})
