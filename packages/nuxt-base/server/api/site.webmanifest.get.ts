import { withBase } from 'ufo'

export default defineCachedEventHandler(() => {
  const baseURL = useRuntimeConfig().app.baseURL
  return {
    name: '',
    short_name: '',
    icons: [
      {
        src: withBase('/android-chrome-192x192.png', baseURL),
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: withBase('/android-chrome-512x512.png', baseURL),
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone',
  }
}, { maxAge: 60 * 60 })
