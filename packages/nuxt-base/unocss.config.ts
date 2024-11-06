import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, presetAttributify, presetIcons, presetUno, transformerDirectives, transformerVariantGroup } from 'unocss'
import { FileSystemIconLoader } from '@iconify/utils/lib/loader/node-loaders'

const __dirname = dirname(fileURLToPath(import.meta.url))

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
      customizations: {
        // https://github.com/unocss/unocss/issues/4084
        iconCustomizer(collection, icon, props) {
          props.width = '1.5em'
          props.height = '1.5em'
        },
      },
      collections: {
        tw: FileSystemIconLoader(resolve(__dirname, 'assets/icons')),
      },
    }),

  ],
  transformers: [
    transformerVariantGroup(),
    transformerDirectives(),
  ],
})
