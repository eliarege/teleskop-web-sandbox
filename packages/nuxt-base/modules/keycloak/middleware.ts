import { withBase } from 'ufo'

const config = useRuntimeConfig()
const kcConfig = useAppConfig().keycloak || {}
const kcEnabled = config.public.kcEnabled
const unauthorized = () => navigateTo('/unauthorized', { replace: true })

export default defineNuxtRouteMiddleware(async (to) => {
  if (!kcEnabled)
    return

  const noAuth = to.meta.noAuth as boolean ?? false
  if (noAuth)
    return

  const keycloak = useKeycloak()

  await until(keycloak.didInitialise).toBe(true)

  if (!keycloak.authenticated.value) {
    return keycloak.login({
      redirectUri: withBase(to.path, location.origin),
    })
  }
  const roles = to.meta.roles ?? []
  if (typeof roles !== 'object' || !Array.isArray(roles) || !roles.every(r => typeof r === 'string')) {
    throw new TypeError(`${to.path} roles should be string[]`)
  }
  if (kcConfig.accessRole || roles.length) {
    try {
      await keycloak.updateToken(kcConfig.minimumTokenValidity)
    } catch (err) {
      if (!keycloak.authenticated.value) {
        return unauthorized()
      }
    }
    if (
      (kcConfig.accessRole && !keycloak.hasResourceRole(kcConfig.accessRole))
      || (roles.length && !roles.some(role => keycloak.hasResourceRole(role)))
    ) {
      return unauthorized()
    }
  }
})
