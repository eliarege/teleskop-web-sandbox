export default defineNuxtPlugin(() => {
  const config = useAppConfig()
  const unauthorized = () => navigateTo('/unauthorized', { replace: true })

  addRouteMiddleware('auth', async (to) => {
    const noAuth = to.meta.noAuth ?? false
    if (noAuth)
      return

    const keycloak = useKeycloak()

    await until(keycloak.didInitialise).toBe(true)

    if (!keycloak.authenticated.value) {
      return keycloak.login()
    }

    const roles = to.meta.roles
    if (roles?.length) {
      try {
        await keycloak.updateToken(config.minimumTokenValidity)
      } catch (err) {
        if (!keycloak.authenticated.value) {
          return unauthorized()
        }
      }
      const authorized = roles.every(role => keycloak.hasResourceRole(role))
      if (!authorized) {
        return unauthorized()
      }
    }
  }, { global: config.globalAuthMiddleware })
})
