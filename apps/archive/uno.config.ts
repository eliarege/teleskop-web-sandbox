// uno.config.ts
import { mergeConfigs } from 'unocss'
import baseConfig from './.nuxt/uno.config.mjs'

export default mergeConfigs([baseConfig, {
  // ...UnoCSS options
  shortcuts: {
    'wh-full': 'w-full h-full',
  },
}])
