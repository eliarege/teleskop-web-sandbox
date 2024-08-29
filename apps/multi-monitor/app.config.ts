export default defineAppConfig({
  keycloak: {
    globalMiddleware: false,
    loginRequired: false,
    minimumTokenValidity: 30,
    enableLogging: import.meta.env.DEV,
  },
})
