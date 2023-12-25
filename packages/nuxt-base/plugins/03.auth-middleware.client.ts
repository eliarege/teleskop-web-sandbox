export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const appConfig = useAppConfig()
  const kcEnabled = config.public.kcEnabled
  const unauthorized = () => navigateTo('/unauthorized', { replace: true })

  addRouteMiddleware('auth', async (to) => {
    if (!kcEnabled)
      return

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
        await keycloak.updateToken(appConfig.minimumTokenValidity)
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
  }, { global: appConfig.globalAuthMiddleware })
})
