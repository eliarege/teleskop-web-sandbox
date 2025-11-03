import process from 'node:process'
import { defineConfiguration, inferBoolean } from '@teleskop/utils'

export const config = defineConfiguration({
  appName: {
    env: 'APP_NAME',
    default: 'websockify',
  },
  serverPrefix: {
    env: 'SERVER_PREFIX',
    default: '/',
  },
  serverHost: {
    env: 'SERVER_HOST',
    default: '0.0.0.0',
  },
  serverPort: {
    env: 'SERVER_PORT',
    type: 'integer',
    default: 6800,
  },
  teleskopHost: {
    type: 'string',
    default: 'localhost',
    env: ['TELESKOP_HOST', 'NUXT_TELESKOP_HOST'],
  },
  teleskopPort: {
    type: 'integer',
    default: 1433,
    env: ['TELESKOP_PORT', 'NUXT_TELESKOP_PORT'],
  },
  teleskopUser: {
    type: 'string',
    required: process.env.NODE_ENV === 'production',
    env: ['TELESKOP_USER', 'NUXT_TELESKOP_USER'],
  },
  teleskopPassword: {
    type: 'string',
    env: ['TELESKOP_PASSWORD', 'NUXT_TELESKOP_PASSWORD'],
    required: process.env.NODE_ENV === 'production',
  },
  teleskopDatabase: {
    type: 'string',
    env: ['TELESKOP_DATABASE', 'NUXT_TELESKOP_DATABASE'],
  },
  teleskopInstanceName: {
    type: 'string',
    env: ['TELESKOP_INSTANCE_NAME', 'NUXT_TELESKOP_INSTANCE_NAME'],
  },
  dmsEnabled: {
    type: 'boolean',
    default: false,
    env: ['DMS_ENABLED', 'RECIPES_DB_ENABLED'],
  },
  dmsHost: {
    type: 'string',
    default: 'localhost',
    env: ['DMS_HOST', 'RECIPES_DB_HOST', 'NUXT_RECIPES_DB_HOST'],
  },
  dmsPort: {
    type: 'integer',
    default: 5432,
    env: ['DMS_PORT', 'RECIPES_DB_PORT', 'NUXT_RECIPES_DB_PORT'],
  },
  dmsUser: {
    type: 'string',
    required: process.env.NODE_ENV === 'production' && inferBoolean(process.env.DMS_ENABLED),
    env: ['DMS_USER', 'RECIPES_DB_USER', 'NUXT_RECIPES_DB_USER'],
  },
  dmsPassword: {
    type: 'string',
    env: ['DMS_PASSWORD', 'RECIPES_DB_PASSWORD', 'NUXT_RECIPES_DB_PASSWORD'],
    required: process.env.NODE_ENV === 'production' && inferBoolean(process.env.DMS_ENABLED),
  },
  dmsDatabase: {
    type: 'string',
    env: ['DMS_DATABASE', 'RECIPES_DB_NAME', 'NUXT_RECIPES_DB_NAME'],
  },
  /** Pino Log Level (debug|info|warn|error|fatal) */
  logLevel: {
    type: 'string',
    env: ['LOG_LEVEL', 'NUXT_LOG_LEVEL'],
    default: 'info',
  },
  /** Dev only, ignores `TELESKOP_*` variables when set */
  targetHost: {
    type: 'string',
    env: 'TARGET_HOST',
  },
  /** Dev only, used with `targetHost` */
  targetPort: {
    type: 'integer',
    env: 'TARGET_PORT',
    default: 5900,
  },
  /** Dev only, required if `targetHost` is defined */
  targetPassword: {
    type: 'string',
    env: 'TARGET_PASSWORD',
  },
  keycloakUrl: {
    type: 'string',
    env: ['KC_URL', 'NUXT_PUBLIC_KC_URL'],
    required: inferBoolean(process.env.KC_ENABLED),
  },
  keycloakRealm: {
    type: 'string',
    env: ['KC_REALM', 'NUXT_PUBLIC_KC_REALM'],
    required: inferBoolean(process.env.KC_ENABLED),
  },
  keycloakClientId: {
    type: 'string',
    env: ['KC_CLIENT_ID', 'NUXT_PUBLIC_KC_CLIENT_ID'],
    required: inferBoolean(process.env.KC_ENABLED),
  },
  keycloakEnabled: {
    type: 'boolean',
    env: ['KC_ENABLED', 'NUXT_PUBLIC_KC_ENABLED'],
    default: false,
  },
  /** Dev only, token to use for authentication */
  keycloakDevToken: {
    type: 'string',
    env: 'KC_DEV_TOKEN',
  },
})
