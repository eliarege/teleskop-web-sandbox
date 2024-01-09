import { defineBuildConfig } from 'unbuild'
import { workspaceExternals } from 'build-utils'

export default defineBuildConfig({
  entries: [
    'index',
    { input: 'views/', outDir: 'dist/views' },
    { input: 'assets/', outDir: 'dist/assets' },
  ],
  outDir: 'dist',
  clean: true,
  hooks: {
    'build:prepare': (ctx) => {
      workspaceExternals(ctx)
    },
  },
  replace: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})
