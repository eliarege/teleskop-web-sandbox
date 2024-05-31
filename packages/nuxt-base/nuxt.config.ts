import { resolve } from 'node:path'
import process from 'node:process'

const appMetaVars = {
  name: process.env.APP_NAME || '',
  version: process.env.APP_VERSION || '',
  commitHash: process.env.APP_COMMIT_HASH || '',
  buildDate: process.env.APP_BUILD_DATE || '',
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  runtimeConfig: {
    public: {
      appList: '',
      kcUrl: 'http://localhost:8080',
      kcRealm: 'teleskop-web',
      kcClientId: 'nuxt-client',
      kcEnabled: false,
    },
  },
  css: [
    '@unocss/reset/tailwind.css',
    resolve(__dirname, './assets/global.css'),
  ],
  modules: [
    '@unocss/nuxt',
    '@vueuse/nuxt',
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@element-plus/nuxt',
    'nuxt-quasar-ui',
    'nuxt-icon',
  ],
  nitro: {
    replace: {
      ...Object.fromEntries(
        Object.entries(appMetaVars).map(([key, val]) => [
          `import.meta.app.${key}`,
          JSON.stringify(val),
        ]),
      ),
      ...Object.fromEntries(
        Object.entries(appMetaVars).map(([key, val]) => [
          `process.app.${key}`,
          JSON.stringify(val),
        ]),
      ),
    },
  },
  quasar: {
    plugins: [
      'BottomSheet',
      'Dialog',
      'Notify',
    ],
    components: {
      defaults: {
        QBtn: {
          // @ts-expect-error Ripple is fine
          ripple: false,
        },
      },
    },
  },
  elementPlus: {
    icon: false,
  },
  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'teleskop_locale',
    },
    langDir: './locales',
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'tr', name: 'Türkçe', file: 'tr.json' },
      { code: 'pt', name: 'Português', file: 'pt.json' },
    ],
  },
  vite: {
    vue: {
      template: {
        // Nuxt layers break merging strategy of vite configurations.
        // It breaks url transformations on projects that has their own configurations like `multi-monitor`
        transformAssetUrls: {
          video: ['src', 'poster'],
          source: ['src'],
          img: ['src'],
          image: ['xlink:href', 'href'],
          use: ['xlink:href', 'href'],
        },
      },
    },
  },
  hooks: {
    'schema:extend': (schemas) => {
      schemas.push({
        appConfig: {
          keycloak: {
            $schema: {
              title: 'Keycloak',
              description: 'Configure keycloak plugin and middleware behaviour',
            },
            globalMiddleware: {
              $default: false,
              $schema: {
                title: 'Global Middleware',
                description: 'Adds `auth` middleware as global middleware. Authentication is done silently unlike `loginRequired`',
                tsType: 'boolean',
              },
            },
            loginRequired: {
              $default: false,
              $schema: {
                title: 'Login Required',
                description: 'Redirects user to login page if the user is not logged in.',
                tsType: 'boolean',
              },
            },
            minimumTokenValidity: {
              $default: 5,
              $schema: {
                title: 'Minimum Token Validity',
                description: 'Access tokens are refreshed if it expires within `minimumTokenValidity` seconds.',
                tsType: 'number',
              },
            },
            enableLogging: {
              $default: 'import.meta.env.DEV',
              $schema: {
                title: 'Global Middleware',
                description: 'Enables logging of `keycloak-js`',
                tsType: 'boolean',
              },
            },
          },
        },
      })
    },
  },
})
