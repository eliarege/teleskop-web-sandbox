import { readFile } from 'node:fs/promises'
import type { Plugin as RollupPlugin } from 'rollup'

const base64Re = /(\?|&)base64(?:&|$)/

/**
 * Rollup plugin to load files as base64-encoded strings
 * Files must have a `?base64` query string to be processed
 * Example: import font from '~/assets/fonts/roboto.ttf?base64'
 *
 */
export function base64Loader(): RollupPlugin {
  return {
    name: 'rollup-plugin-base64-loader',

    async load(id) {
      // Only process files with ?base64 query string
      if (!base64Re.test(id)) {
        return null
      }

      // Remove query params to get the actual file path
      const cleanId = id.split('?')[0]

      try {
        const base64 = await readFile(cleanId, 'base64')
        return `export default "${base64}"`
      } catch (error) {
        this.error(`Failed to load file as base64: ${error.message}`)
      }
    },
  }
}

export default base64Loader
