import { defineConfig } from 'unocss'
import sharedConfig from '@teleskop/unocss-config'

const extended = {
  ...sharedConfig,
  theme: {
    breakpoints: {
      lg: '1200px',
      sm: '768px',
      md: '768px',
    },
  },
}
export default defineConfig({ ...extended })
// export default mergeConfigs([sharedConfig])
