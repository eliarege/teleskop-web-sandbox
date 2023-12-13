export default defineAppConfig({
  minimumTokenValidity: 30,
  globalAuthMiddleware: false,
  loginRequired: false,
  enableKeycloakLogging: import.meta.env.DEV
})
