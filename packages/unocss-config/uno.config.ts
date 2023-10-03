import { defineConfig, presetAttributify, presetUno, transformerDirectives, transformerVariantGroup } from 'unocss'

// https://unocss.dev/guide/
export default defineConfig({
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
    'e-border': 'border-solid border-1px border-black',
  },
  presets: [
    presetUno({ preflight: true }),
    presetAttributify(),
  ],
  transformers: [
    transformerVariantGroup(),
    transformerDirectives(),
  ],
})
