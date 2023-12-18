import type { FastifyReply, FastifyRequest, RouteOptions, onRequestHookHandler } from 'fastify'
import fp from 'fastify-plugin'
import type { JWTPayload } from 'jose'
import { createRemoteJWKSet, jwtVerify } from 'jose'

export interface KeycloakPluginConfig {
  url: string
  realm: string
  clientId: string
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

declare module 'fastify' {
  interface FastifyRequest {
    kauth: (JWTPayload & KeycloakScope) | null
  }
  interface RouteShorthandOptions {
    auth?: boolean | KeycloakAuthOptions
  }
}

const BEARER_RE = /^[Bb]earer$/

function getBearerToken(request: FastifyRequest): string | null {
  const [type, token] = request.headers.authorization?.split(' ') || ''
  return BEARER_RE.test(type) ? token : null
}

function addRequestHook(options: RouteOptions, hook: onRequestHookHandler) {
  if (options.onRequest) {
    if (Array.isArray(options.onRequest)) {
      options.onRequest.push(hook)
    } else {
      options.onRequest = [options.onRequest, hook]
    }
  } else {
    options.onRequest = [hook]
  }
}

function callUnauthenticated(reply: FastifyReply) {
  return reply.status(401).send('Unauthenticated')
}

function callUnauthorized(reply: FastifyReply) {
  return reply.status(403).send('Unauthorized')
}

export const keycloakAdapter = fp<KeycloakPluginConfig>((fastify, config, done) => {
  /** JSON Web Key Set. Read more: https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-key-sets */
  const JWKS = createRemoteJWKSet(new URL(`${config.url}/realms/${config.realm}/protocol/openid-connect/certs`))

  function createRequestHook(auth: KeycloakAuthOptions): onRequestHookHandler {
    const requiredRoles = auth.roles || []

    return async (request, reply) => {
      const jwt = getBearerToken(request)
      if (!jwt) {
        fastify.log.debug('No Bearer Token')
        return callUnauthenticated(reply)
      }
      try {
        const { payload } = await jwtVerify<KeycloakScope>(jwt, JWKS)
        if (requiredRoles.length) {
          const userRoles = payload.resource_access?.[config.clientId].roles || []
          const hasPermission = requiredRoles.every(role => userRoles.includes(role))
          if (!hasPermission) {
            fastify.log.debug('Does not have permission')
            return callUnauthorized(reply)
          }
        }
        request.kauth = payload
      } catch (err) {
        fastify.log.debug(err, 'Invalid JWT')
        return callUnauthenticated(reply)
      }
    }
  }

  fastify.decorateRequest('kauth', null)

  fastify.addHook('onRoute', (options) => {
    if (options.auth) {
      const auth = typeof options.auth === 'boolean' ? {} : options.auth
      addRequestHook(options, createRequestHook(auth))
    }
  })

  done()
})
