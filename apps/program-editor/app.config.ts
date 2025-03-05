export default defineAppConfig({
  keycloak: {
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
