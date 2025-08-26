import type { Buffer } from 'node:buffer'
import process from 'node:process'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { WebSocket } from 'ws'
import { JOSEError } from 'jose/errors'
import { logger as parentLogger } from './logger'
import { config } from './config'

const logger = parentLogger.child({ name: 'auth' })

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

export type AuthResult<T = any> =
  | { status: 'success', payload: T }
  | { status: 'error', reason: Error }

export interface AuthPayload {
  name: string
  roles: string[]
}

export interface KeycloakAuthMethods {
  authenticate: (socket: WebSocket) => Promise<AuthResult<AuthPayload>>
}

export type KeycloakAuth =
  | ({ enabled: true } & KeycloakAuthMethods)
  | { enabled: false }

if (process.env.NODE_ENV === 'development' && process.env.KC_DEV_TOKEN) {
  logger.info(`Using KC_DEV_TOKEN for authentications`)
}

function sendError(msg: string): AuthResult {
  return {
    status: 'error',
    reason: new Error(msg),
  }
}

function sendPayload<T>(payload: T): AuthResult<T> {
  return {
    status: 'success',
    payload,
  }
}

export function initKcAuth(): KeycloakAuth {
  if (!config.keycloakEnabled) {
    return { enabled: false }
  }
  logger.debug('Authentication enabled')
  const JWKS = createRemoteJWKSet(new URL(`${config.keycloakUrl}/realms/${config.keycloakRealm}/protocol/openid-connect/certs`))

  async function authenticate(client: WebSocket): Promise<AuthResult> {
    const result = await getBearer(client)
    if (result.status === 'error') {
      return result
    }
    const jwt = result.payload
    if (!jwt) {
      return sendError('No Bearer Token')
    }
    try {
      const { payload } = await jwtVerify<KeycloakScope>(jwt, JWKS)
      return sendPayload({
        name: payload.preferred_username || 'unknown_user',
        roles: payload.resource_access?.[config.keycloakClientId!]?.roles || [],
      })
    } catch (err) {
      if (err instanceof JOSEError) {
        logger.debug(err)
        return sendError(err.code)
      } else {
        logger.error(err)
        return sendError('Internal Server Error')
      }
    }
  }

  return {
    enabled: true,
    authenticate,
  }
}

/** Wait until socket sends bearer message  */
function getBearer(socket: WebSocket, authTimeout = 1000) {
  const BEARER_RE = /^[Bb]earer /

  // Return Dev Token
  if (process.env.NODE_ENV === 'development' && process.env.KC_DEV_TOKEN) {
    return Promise.resolve(sendPayload(process.env.KC_DEV_TOKEN))
  }

  return new Promise<AuthResult<string>>((resolve) => {
    const timeout = setTimeout(() => {
      socket.off('message', listener)
      resolve(sendError('Auth timeout'))
    }, authTimeout)

    function listener(data: Buffer) {
      const msg = data.toString('utf-8')
      if (!BEARER_RE.test(msg))
        return resolve(sendError('Auth failed'))

      clearTimeout(timeout)
      resolve(sendPayload(msg.slice(7)))
    }

    socket.once('message', listener)
  })
}
