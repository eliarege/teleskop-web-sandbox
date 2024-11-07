import { mergeConfigs } from '@unocss/core'
import baseConfig from './.nuxt/uno.config.mjs'

export default mergeConfigs([baseConfig, {
  theme: {
    breakpoints: {
      lg: '1200px',
      sm: '768px',
      md: '768px',
    },
  },
}])
