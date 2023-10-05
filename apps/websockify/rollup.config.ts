import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import alias from '@rollup/plugin-alias'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import { defineConfig } from 'rollup'
import esbuild from 'rollup-plugin-esbuild'

const { dependencies } = JSON.parse(readFileSync('package.json', 'utf-8'))
const BUILD_DIR = process.env.BUILD_DIR || 'dist'

export default defineConfig({
  input: 'src/server.ts',
  external: [...Object.keys(dependencies)],
  output: {
    file: join(BUILD_DIR, 'server.js'),
    sourcemap: true,
  },
  plugins: [
    replace({
      'preventAssignment': true,
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
    resolve({
      extensions: ['.ts', '.js', '.mjs'],
    }),
    alias({
      entries: [
        { find: '~', replacement: join(process.cwd(), 'src') },
      ],
    }),
    esbuild({
      target: 'esnext',
    }),
  ],
})
