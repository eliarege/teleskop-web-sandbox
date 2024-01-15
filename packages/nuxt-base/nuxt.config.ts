import process from 'node:process'
import i18n from '@intlify/unplugin-vue-i18n/vite'

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
  css: ['@unocss/reset/tailwind.css'],
  modules: [
    '@unocss/nuxt',
    '@vueuse/nuxt',
    '@pinia/nuxt',
    '@element-plus/nuxt',
    'nuxt-quasar-ui',
    'nuxt-icon',
  ],
  imports: {
    presets: [
      {
        from: 'vue-i18n',
        imports: ['useI18n'],
      },
    ],
  },
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
  },
  elementPlus: {
    icon: false,
  },
  vite: {
    plugins: [
      i18n({
        include: ['locales/*'],
      }),
    ],
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
            globalMiddlware: {
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
