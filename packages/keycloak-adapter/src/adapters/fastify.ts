import type { FastifyReply, FastifyRequest, RouteOptions, onRequestHookHandler } from 'fastify'
import fp from 'fastify-plugin'
import type { JWTPayload } from 'jose'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { KeycloakScope } from '../types'
import { isBearer } from '../utils'

export interface FastifyAdapterConfig {
  url: string
  realm: string
  clientId: string
  accessRole?: string | null
  global?: boolean
}

export interface KeycloakAuthOptions {
  roles?: string[]
}

declare module 'fastify' {
  interface FastifyRequest {
    kauth: (JWTPayload & KeycloakScope) | null
  }
  interface RouteShorthandOptions {
    auth?: boolean | KeycloakAuthOptions
  }
}

function getBearerToken(request: FastifyRequest): string | null {
  const [type, token] = request.headers.authorization?.split(' ') || ''
  return isBearer(type) ? token : null
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

export const fastifyAdapter = fp<FastifyAdapterConfig>((fastify, config, done) => {
  /** JSON Web Key Set. Read more: https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-key-sets */
  const JWKS = createRemoteJWKSet(new URL(`${config.url}/realms/${config.realm}/protocol/openid-connect/certs`))

  function createRequestHook(auth: KeycloakAuthOptions): onRequestHookHandler {
    const roles = auth.roles || []

    return async (request, reply) => {
      const jwt = getBearerToken(request)
      if (!jwt) {
        fastify.log.debug('No Bearer Token')
        return callUnauthenticated(reply)
      }
      try {
        const { payload } = await jwtVerify<KeycloakScope>(jwt, JWKS)
        if (roles.length || config.accessRole) {
          const userRoles = payload.resource_access?.[config.clientId]?.roles || []
          if (
            (config.accessRole && !userRoles.includes(config.accessRole))
            || (roles.length && !roles.some(role => userRoles.includes(role)))
          ) {
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
    const auth = options.auth ?? config.global ?? false
    if (auth) {
      addRequestHook(options, createRequestHook(typeof auth === 'boolean' ? {} : auth))
    }
  })

  done()
})
