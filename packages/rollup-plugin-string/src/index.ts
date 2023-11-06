import { extname } from 'node:path'
import type { Plugin } from 'rollup'
import type { FilterPattern } from '@rollup/pluginutils'
import { createFilter } from '@rollup/pluginutils'

export interface RollupPluginStringOptions {
  ext: string[]
  include?: FilterPattern
  exclude?: FilterPattern
}

export default function string(options: RollupPluginStringOptions): Plugin {
  const filter = createFilter(options.include, options.exclude)
  return {
    name: 'rollup-plugin-string',
    transform(code, id) {
      const ext = extname(id)
      if (options.ext.includes(ext) && filter(id)) {
        return {
          code: `export default ${JSON.stringify(code)}`,
          map: { mappings: '' },
        }
      }
    },
  }
}
