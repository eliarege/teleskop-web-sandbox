export default defineAppConfig({
  keycloak: {
    loginRequired: true,
    minimumTokenValidity: 30,
    enableLogging: import.meta.env.DEV,
    // authFallbackTo: '/recipe',
  },
})
