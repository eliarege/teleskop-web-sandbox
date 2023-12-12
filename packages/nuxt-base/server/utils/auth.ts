import { keycloakAdapter } from 'h3-keycloak-adapter'

const config = useRuntimeConfig()

export const { defineAuthEventHandler } = keycloakAdapter({
  url: config.public.kcUrl,
  realm: config.public.kcRealm,
  clientId: config.public.kcClientId,
})
