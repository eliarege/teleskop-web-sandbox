import { h3Adapter } from '@teleskop/keycloak-adapter/h3'

const config = useRuntimeConfig()
const kcConfig = useAppConfig().keycloak

export const { defineAuthEventHandler } = config.public.kcEnabled
  ? h3Adapter({
    url: config.kcBackchannelUrl,
    realm: config.public.kcRealm,
    clientId: config.public.kcClientId,
    accessRole: kcConfig?.accessRole ?? null
  })
  : { defineAuthEventHandler: defineEventHandler } as ReturnType<typeof h3Adapter>
