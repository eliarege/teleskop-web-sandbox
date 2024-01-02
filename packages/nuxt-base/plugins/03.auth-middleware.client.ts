export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const kcConfig = useAppConfig().keycloak
  const kcEnabled = config.public.kcEnabled
  const unauthorized = () => navigateTo('/unauthorized', { replace: true })

  addRouteMiddleware('auth', async (to) => {
    if (!kcEnabled)
      return

    const noAuth = to.meta.noAuth as boolean ?? false
    if (noAuth)
      return

    const keycloak = useKeycloak()

    await until(keycloak.didInitialise).toBe(true)

    if (!keycloak.authenticated.value) {
      return keycloak.login()
    }
    const roles = to.meta.roles as string[] | undefined
    if (roles?.length) {
      try {
        await keycloak.updateToken(kcConfig?.minimumTokenValidity)
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
  }, { global: kcConfig?.globalMiddlware ?? false })
})
