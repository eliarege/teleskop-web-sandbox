import { defineConfig, presetAttributify, presetIcons, presetUno, transformerDirectives, transformerVariantGroup } from 'unocss'

// https://unocss.dev/guide/
export default defineConfig({
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
    'e-border': 'border-solid border-1px border-black',
  },
  theme: {
    colors: {
      primary: '#1976D2',
    },
  },
  presets: [
    presetUno({
      preflight: true,
      dark: {
        dark: '.body--dark',
        light: '.body--light',
      },
    }),
    presetAttributify(),
    presetIcons({
      warn: true,
    }),
  ],
  transformers: [
    transformerVariantGroup(),
    transformerDirectives(),
  ],
})
