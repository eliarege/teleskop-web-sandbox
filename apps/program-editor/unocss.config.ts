import sharedConfig from '@teleskop/unocss-config'
import { mergeConfigs, presetIcons } from 'unocss'

export default mergeConfigs([
  sharedConfig,
  {
    presets: [
      presetIcons(),
    ],
    content: {
      pipeline: {
        include: [/\.(vue|svelte|[jt]sx|ts|mdx?|astro|elm|php|phtml|html)($|\?)/],
      },
    },
    shortcuts: [
      {
        'flex-center': 'flex justify-center items-center',
        'e-border': 'border-(1 black opacity-20 rounded)',
        'e-selected': 'bg-blue-200 dark:(bg-blue-900)',
        'e-text-dim': '!text-(black opacity-20) dark:(!text-(white opacity-20))',
      },
      [/^e-div-([xy])$/, ([, d]) => `divide-(${d} black opacity-20) dark:(divide-(${d} white opacity-20))`],
      [/^e-border-color(?:-(\d+))?$/, ([_, op]) => `border-(black opacity-${op || '20'}) dark:(border-(white opacity-${op || '20'}))`],
    ],
  },
])
