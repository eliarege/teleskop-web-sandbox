import { JWTPayload, createRemoteJWKSet, jwtVerify } from 'jose'
import { H3Event, EventHandler, EventHandlerRequest, EventHandlerResponse } from 'h3'
import { defineEventHandler, getHeader, createError } from 'h3'
import { createConsola, LogLevels, type LogLevel } from 'consola'

export interface KeycloakAdapterConfig {
  url: string
  realm: string
  clientId: string
  logger?: boolean
  logLevel?: LogLevel
}

export interface KeycloakAuthOptions {
  roles?: string[]
}

export interface KeycloakScope {
  scope?: string
  name?: string
  preferred_username?: string
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

export type H3AuthEvent<Request extends EventHandlerRequest> = H3Event<Request> & {
  context: { kauth: KeycloakScope & JWTPayload }
}

export interface AuthEventHandler<Request extends EventHandlerRequest = EventHandlerRequest, Response extends EventHandlerResponse = EventHandlerResponse> {
  __is_handler__?: true;
  (event: H3AuthEvent<Request>): Response;
}

export interface AuthEventHandlerObject<T extends EventHandlerRequest, D> {
  roles?: string[]
  handler: AuthEventHandler<T, D>
}


export function keycloakAdapter(config: KeycloakAdapterConfig) {
  /** JSON Web Key Set. Read more: https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-key-sets */
  const logger = createConsola({
    level: config.logger ? config.logLevel : LogLevels.silent
  })
  const JWKS = createRemoteJWKSet(new URL(`${config.url}/realms/${config.realm}/protocol/openid-connect/certs`))

  return {
    defineAuthEventHandler<T extends EventHandlerRequest, D>(
      authHandler:
        | AuthEventHandlerObject<T, D>
        | AuthEventHandler<T, D>
    ): EventHandler<T, D> {
      const { handler, roles = [] } = typeof authHandler === 'object'
        ? authHandler
        : { handler: authHandler }

      return defineEventHandler<T>(async (event) => {
        // Authentication
        const jwt = getBearerToken(event)
        if (!jwt) {
          logger.debug('No Bearer Token')
          throw createError({ statusMessage: 'Unauthenticated', statusCode: 401 })
        }
        try {
          const { payload } = await jwtVerify<KeycloakScope>(jwt, JWKS)
          // Authorization
          if (roles.length) {
            const userRoles = payload.resource_access?.[config.clientId].roles || []
            const hasPermission = roles.every(role => userRoles.includes(role))
            if (!hasPermission) {
              logger.debug('Does not have permission')
              throw createError({ statusMessage: 'Unauthorized', statusCode: 403 })
            }
          }
          event.context.kauth = payload
        } catch (err) {
          logger.debug(err, 'Invalid JWT')
          throw createError({ statusMessage: 'Unauthenticated', statusCode: 401 })
        }
        return handler(event as H3AuthEvent<T>)
      })
    }
  }
}
