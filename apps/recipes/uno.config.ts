import { mergeConfigs } from '@unocss/core'
import { defineConfig, presetAttributify } from 'unocss'
import baseConfig from './.nuxt/uno.config.mjs'

export default mergeConfigs([
  baseConfig,
  defineConfig({
    presets: [
      presetAttributify(),
    ],
  }),
])
