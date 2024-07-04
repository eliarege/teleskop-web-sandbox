import type { JWTPayload } from 'jose'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { createError, defineEventHandler, getHeader } from 'h3'
import type { EventHandlerRequest, EventHandlerResponse, H3Event } from 'h3'
import { type LogLevel, createConsola } from 'consola'
import type { KeycloakScope } from '../types'
import { isBearer } from '../utils'

export interface H3AdapterConfig {
  url: string
  realm: string
  clientId: string
  logger?: boolean
  logLevel?: LogLevel
}

export interface KeycloakAuthOptions {
  roles?: string[]
}

export type KeycloakPayload = KeycloakScope & JWTPayload

function getBearerToken(event: H3Event): string | null {
  const auth = getHeader(event, 'Authorization')
  const [type, token] = auth?.split(' ') || ''
  return isBearer(type) ? token : null
}

export type H3AuthEvent<Request extends EventHandlerRequest> = H3Event<Request> & {
  context: { kauth: KeycloakPayload }
}

export interface AuthEventHandler<Request extends EventHandlerRequest = EventHandlerRequest, Response extends EventHandlerResponse = EventHandlerResponse> {
  __is_handler__?: true
  (event: H3AuthEvent<Request>): Response
}

export interface AuthEventHandlerObject<T extends EventHandlerRequest, D> {
  roles?: string[]
  handler: AuthEventHandler<T, D>
}

export function h3Adapter(config: H3AdapterConfig) {
  /** JSON Web Key Set. Read more: https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-key-sets */
  const logger = createConsola({
    level: config.logger ? config.logLevel : -999,
  })
  const JWKS = createRemoteJWKSet(new URL(`${config.url}/realms/${config.realm}/protocol/openid-connect/certs`))

  async function auth(event: H3Event): Promise<KeycloakPayload | null> {
    const jwt = getBearerToken(event)
    if (!jwt) {
      logger.debug('No Bearer Token')
      return null
    }
    try {
      const { payload } = await jwtVerify<KeycloakScope>(jwt, JWKS)
      return payload
    } catch (err) {
      logger.debug(err, 'Invalid JWT')
      return null
    }
  }

  return {
    /** Authorize event. */
    auth,
    defineAuthEventHandler<T extends EventHandlerRequest, D>(
      authHandler:
        | AuthEventHandlerObject<T, D>
        | AuthEventHandler<T, D>,
    ): AuthEventHandler<T, D> {
      const { handler, roles = [] } = typeof authHandler === 'object'
        ? authHandler
        : { handler: authHandler }

      return defineEventHandler<T>(async (event) => {
        // Authentication
        const payload = await auth(event)
        if (!payload) {
          throw createError({ statusMessage: 'Unauthenticated', statusCode: 401 })
        }
        if (roles.length) {
          const userRoles = payload.resource_access?.[config.clientId]?.roles || []
          const hasPermission = roles.every(role => userRoles.includes(role))
          if (!hasPermission) {
            logger.debug('Does not have permission')
            throw createError({ statusMessage: 'Unauthorized', statusCode: 403 })
          }
        }
        event.context.kauth = payload
        return handler(event as H3AuthEvent<T>)
      })
    },
  }
}
