import { createHead } from 'unhead'
import { renderSSRHead } from '@unhead/ssr'
import { withBase } from 'ufo'

const darkThemeMedia = '(prefers-color-scheme: dark)'
const lightThemeMedia = '(prefers-color-scheme: light)'

export default defineNitroPlugin(async (nitro) => {
  const { baseURL } = useRuntimeConfig().app
  const head = createHead()
  head.push({
    title: 'Teleskop Web',
    link: [
      { rel: 'icon', type: 'image/png', media: lightThemeMedia, sizes: '32x32', href: withBase('/favicon-light-32x32.png', baseURL) },
      { rel: 'icon', type: 'image/png', media: lightThemeMedia, sizes: '16x16', href: withBase('/favicon-light-16x16.png', baseURL) },
      { rel: 'icon', type: 'image/png', media: darkThemeMedia, sizes: '32x32', href: withBase('/favicon-dark-32x32.png', baseURL) },
      { rel: 'icon', type: 'image/png', media: darkThemeMedia, sizes: '16x16', href: withBase('/favicon-dark-16x16.png', baseURL) },
      { rel: 'apple-touch-icon', sizes: '180x180', href: withBase('/apple-touch-icon.png', baseURL) },
      { rel: 'manifest', href: withBase('/site.webmanifest', baseURL) },
      { rel: 'mask-icon', href: withBase('/safari-pinned-tab.svg', baseURL), color: '#1c1917' },
    ],
  })

  const { headTags } = await renderSSRHead(head)

  nitro.hooks.hook('render:html', (htmlContext) => {
    htmlContext.head.push(headTags)
  })
})
