export default defineAppConfig({
  keycloak: {
    globalMiddleware: true,
    loginRequired: true,
    minimumTokenValidity: 30,
    enableLogging: import.meta.env.DEV,
  },
  nuxtQuasar: {
    brand: {
      warning: '#f5a623',
    },
  },
})
