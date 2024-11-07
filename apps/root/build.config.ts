import { defineBuildConfig } from 'unbuild'
import { workspaceExternals } from '@teleskop/build-utils'

export default defineBuildConfig({
  entries: [
    'src/index',
    { input: 'src/views/', outDir: 'dist/views' },
    { input: 'src/assets/', outDir: 'dist/assets' },
  ],
  outDir: 'dist',
  clean: true,
  hooks: {
    'build:prepare': (ctx) => {
      workspaceExternals(ctx, {
        traceInclude: ['ejs'],
      })
    },
  },
  replace: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})

