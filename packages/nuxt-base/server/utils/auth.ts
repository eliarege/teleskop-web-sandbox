import { h3Adapter } from '@teleskop/keycloak-adapter/h3'

const config = useRuntimeConfig()

export const { defineAuthEventHandler } = config.public.kcEnabled
  ? h3Adapter({
    url: config.kcBackchannelUrl,
    realm: config.public.kcRealm,
    clientId: config.public.kcClientId,
  })
  : { defineAuthEventHandler: defineEventHandler }
