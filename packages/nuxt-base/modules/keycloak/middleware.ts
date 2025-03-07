import { withBase } from 'ufo'

// Midleware checks if user is authenticated and has required roles to access the page.
export default defineNuxtRouteMiddleware(async (to) => {
  const kcEnabled = useRuntimeConfig().public.kcEnabled ?? false
  if (!kcEnabled || to.meta.noAuth)
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

  const kcConfig = useAppConfig().keycloak || {}
  if (kcConfig.accessRole || roles.length) {
    try {
      await keycloak.updateToken(kcConfig.minimumTokenValidity)
    } catch (err) {
      // Session probably expired, redirect back to login page
      if (!keycloak.authenticated.value) {
        return keycloak.login({
          redirectUri: withBase(to.path, location.origin),
        })
      }
    }
    if (
      (kcConfig.accessRole && !keycloak.hasResourceRole(kcConfig.accessRole))
      || (roles.length && !roles.some(role => keycloak.hasResourceRole(role)))
    ) {
      return navigateTo('/unauthorized', { replace: true })
    }
  }
})
