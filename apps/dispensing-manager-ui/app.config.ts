export default defineAppConfig({
  keycloak: {
    globalMiddleware: false,
    loginRequired: true,
    minimumTokenValidity: 30,
    enableLogging: import.meta.env.DEV,
    // authFallbackTo: '/recipe',
  },
})
