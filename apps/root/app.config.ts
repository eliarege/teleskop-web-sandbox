export default defineAppConfig({
  keycloak: {
    loginRequired: false,
    minimumTokenValidity: 30,
    enableLogging: import.meta.env.DEV,
  },
})
