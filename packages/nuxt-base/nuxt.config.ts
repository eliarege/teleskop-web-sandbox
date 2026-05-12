import { resolve } from 'node:path'
import { base64Loader } from './build/plugins/base64'
import { nearleyLoader } from './build/plugins/nearley'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2024-11-12',
  extends: [
    './layers/task-stream',
    './layers/unsaved-changes',
    './layers/feedback',
  ],
  runtimeConfig: {
    public: {
      appList: '',
      kcUrl: 'http://localhost:8080',
      kcRealm: 'teleskop-web',
      kcClientId: 'nuxt-client',
      kcEnabled: false,
    },
    logLevel: '',
    twName: '',
    twVersion: '',
    twBuildDate: '',
    twCommitHash: '',
    smtpUser: '',
    smtpPassword: '',
    serviceDeskEmail: '',
    customerName: '',
    kcBackchannelUrl: 'http://localhost:8080',
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
  ],
  quasar: {
    plugins: [
      'BottomSheet',
      'Dialog',
      'Notify',
    ],
    extras: {
      font: 'roboto-font-latin-ext',
    },
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
  unocss: {
    nuxtLayers: true,
  },
  postcss: {
    plugins: {
      'postcss-nested': {},
    },
  },
  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en-GB',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'teleskop_locale',
    },
    langDir: './locales',
    locales: [
      { code: 'en-GB', name: 'English', file: 'en.json' },
      { code: 'tr', name: 'Türkçe', file: 'tr.json' },
      { code: 'pt', name: 'Português', file: 'pt.json' },
    ],
  },

  vite: {
    build: {
      assetsInlineLimit: 0,
    },
    plugins: [
      base64Loader(),
      nearleyLoader(),
    ],
    vue: {
      template: {
        transformAssetUrls: {
          // Defaults
          video: ['src', 'poster'],
          source: ['src'],
          img: ['src'],
          image: ['xlink:href', 'href'],
          use: ['xlink:href', 'href'],
          // Custom components
          MachinePanelButton: ['img'],
          LoadingScreen: ['image'],
        },
      },
    },
  },
  nitro: {
    rollupConfig: {
      plugins: [nearleyLoader()],
    },
  },

  hooks: {
    'prepare:types': ({ references }) => {
      references.push({ path: resolve(__dirname, './types/shims.d.ts') })
    },
    'schema:extend': (schemas) => {
      schemas.push({
        appConfig: {
          keycloak: {
            $schema: {
              description: 'Configure keycloak plugin and middleware behaviour',
            },
            accessRole: {
              $default: null,
              $schema: {
                description: 'Required role to access application. Must be defined as Client Role.',
                tsType: 'string | null',
              },
            },
            loginRequired: {
              $default: false,
              $schema: {
                description: 'Redirects user to login page if the user is not logged in.',
                tsType: 'boolean',
              },
            },
            minimumTokenValidity: {
              $default: 5,
              $schema: {
                description: 'Access tokens are refreshed if it expires within `minimumTokenValidity` seconds.',
                tsType: 'number',
              },
            },
            enableLogging: {
              $default: 'import.meta.env.DEV',
              $schema: {
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
