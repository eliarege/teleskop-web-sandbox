import type { IncomingMessage } from 'node:http'
import process from 'node:process'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import manifest from '../manifest.json'
import { logger as parentLogger } from './logger'
import { getEnvOrThrow, inferBoolean } from './utils'

const BEARER_RE = /^[Bb]earer$/
const ALL_ROLES = manifest.roles.map(r => r.name)

const logger = parentLogger.child({ name: 'auth' })

interface KeycloakScope {
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

interface KeycloakConfig {
  url: string
  realm: string
  clientId: string
}

export interface AuthPayload {
  name: string
  roles: string[]
}

interface AuthMethods {
  getAuthPayload(request: IncomingMessage): Promise<AuthPayload | null>
}

function getBearerToken(request: IncomingMessage): string | null {
  const [type, token] = request.headers.authorization?.split(' ') || ''
  return BEARER_RE.test(type) ? token : null
}

function isKeycloakEnabled() {
  const defaultValue = process.env.NODE_ENV === 'production'
  return process.env.KC_ENABLED
    ? inferBoolean(process.env.KC_ENABLED)
    : defaultValue
}

function getKeycloakEnv(): KeycloakConfig {
  try {
    return {
      url: getEnvOrThrow('KC_URL'),
      realm: getEnvOrThrow('KC_REALM'),
      clientId: getEnvOrThrow('KC_CLIENT_ID'),
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      logger.info('You can disable auth by setting KC_ENABLED to false')
    }
    throw err
  }
}

function mockAuth(): AuthMethods {
  return {
    getAuthPayload: async () => ({
      name: 'user',
      roles: ALL_ROLES,
    }),
  }
}

export function initAuth(): AuthMethods {
  const enabled = isKeycloakEnabled()
  if (!enabled) {
    return mockAuth()
  }

  const { url, realm, clientId } = getKeycloakEnv()
  const JWKS = createRemoteJWKSet(new URL(`${url}/realms/${realm}/protocol/openid-connect/certs`))

  async function getAuthPayload(request: IncomingMessage): Promise<AuthPayload | null> {
    const jwt = getBearerToken(request)
    if (!jwt) {
      logger.debug(`No Bearer Token`)
      return null
    }
    try {
      const { payload } = await jwtVerify<KeycloakScope>(jwt, JWKS)
      return {
        name: payload.preferred_username || 'unknown_user',
        roles: payload.resource_access?.[clientId]?.roles || [],
      }
    } catch (err) {
      logger.debug(err, 'Invalid JWT')
      return null
    }
  }

  return {
    getAuthPayload,
  }
}
