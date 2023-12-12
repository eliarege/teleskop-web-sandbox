import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { H3Event } from 'h3'
import { getHeader, send, setResponseStatus } from 'h3'

export interface KeycloakAdapterConfig {
  url: string
  realm: string
  clientId: string
}

export interface KeycloakAuthOptions {
  roles?: string[]
}

interface KeycloakScope {
  session_state?: string
  realm_access?: {
    roles: string[]
  }
  resource_access?: Record<string, {
    roles: string[]
  }>
}

const BEARER_RE = /^[Bb]earer$/

function getBearerToken(event: H3Event): string | null {
  const auth = getHeader(event, 'Authorization')
  const [type, token] = auth?.split(' ') || ''
  return BEARER_RE.test(type) ? token : null
}

function callUnauthenticated(event: H3Event) {
  setResponseStatus(event, 401)
  send(event, 'Unauthenticated')
}

function callUnauthorized(event: H3Event) {
  setResponseStatus(event, 403)
  send(event, 'Unauthorized')
}

export function keycloakAdapter(config: KeycloakAdapterConfig) {
  /** JSON Web Key Set. Read more: https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-key-sets */
  const JWKS = createRemoteJWKSet(new URL(`${config.url}/realms/${config.realm}/protocol/openid-connect/certs`))

  return (options?: KeycloakAuthOptions) => {
    const requiredRoles = options?.roles || []
    return async (event: H3Event) => {
      const jwt = getBearerToken(event)
      if (!jwt) {
        console.debug('No Bearer Token')
        return callUnauthenticated(event)
      }
      try {
        const { payload } = await jwtVerify<KeycloakScope>(jwt, JWKS)
        if (requiredRoles.length) {
          const userRoles = payload.resource_access?.[config.clientId].roles || []
          const hasPermission = requiredRoles.every(role => userRoles.includes(role))
          if (!hasPermission) {
            console.debug('Does not have permission')
            return callUnauthorized(event)
          }
        }
      } catch (err) {
        console.debug(err, 'Invalid JWT')
        return callUnauthenticated(event)
      }
    }
  }
}
