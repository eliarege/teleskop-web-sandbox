import { addPlugin, addRouteMiddleware, createResolver, defineNuxtModule } from '@nuxt/kit'

export interface ModuleOptions {
  /** Adds `auth` middleware as global middleware */
  globalMiddleware?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'keycloak',
    configKey: 'keycloak',
  },
  defaults: {
    globalMiddleware: true,
  },
  setup(options) {
    const resolver = createResolver(import.meta.url)

    addRouteMiddleware({
      name: 'auth',
      path: resolver.resolve('./keycloak/middleware'),
      global: options.globalMiddleware ?? true,
    }, {
      prepend: true,
    })

    addPlugin({
      src: resolver.resolve('./keycloak/plugin'),
      mode: 'client',
      // Run before user plugins
      order: -1,
    })
  },
})
