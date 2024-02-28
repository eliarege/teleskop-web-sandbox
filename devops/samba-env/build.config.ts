import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index'],
  clean: true,
  outDir: 'dist',
  rollup: {
    emitCJS: true,
    output: {
      banner: '#!/usr/bin/env node',
    },
  },
})
