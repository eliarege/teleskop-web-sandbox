import { h3Adapter } from '@teleskop/keycloak-adapter/h3'

const config = useRuntimeConfig()

export const { defineAuthEventHandler } = h3Adapter({
  url: config.public.kcUrl,
  realm: config.public.kcRealm,
  clientId: config.public.kcClientId,
})
