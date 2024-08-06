export default defineAppConfig({
  keycloak: {
    globalMiddleware: true,
    loginRequired: false,
    minimumTokenValidity: 30,
    enableLogging: import.meta.env.DEV,
  },
})
