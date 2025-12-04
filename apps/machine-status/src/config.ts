import { defineConfiguration } from '@teleskop/utils'

export type Config = typeof config

export const config = defineConfiguration({
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
    default: 5000,
  },
  teleskopHost: {
    env: ['TELESKOP_HOST', 'NUXT_TELESKOP_HOST'],
    required: teleskopRequired,
  },
  teleskopPort: {
    env: ['TELESKOP_PORT', 'NUXT_TELESKOP_PORT'],
    type: 'number',
    default: 1433,
  },
  teleskopUser: {
    env: ['TELESKOP_USER', 'NUXT_TELESKOP_USER'],
    required: teleskopRequired,
  },
  teleskopPassword: {
    env: ['TELESKOP_PASSWORD', 'NUXT_TELESKOP_PASSWORD'],
    required: teleskopRequired,
  },
  teleskopDatabase: {
    env: ['TELESKOP_DATABASE', 'NUXT_TELESKOP_DATABASE'],
    required: teleskopRequired,
  },
  teleskopInstanceName: {
    env: ['TELESKOP_INSTANCE_NAME', 'NUXT_TELESKOP_INSTANCE_NAME'],
  },
  /** Extra Querystring connection options */
  teleskopConnectionOptions: {
    env: ['TELESKOP_CONNECTION_OPTIONS', 'NUXT_TELESKOP_CONNECTION_OPTIONS'],
    type: 'querystring',
  },
  /** Teleskop Connection String. Syntax: https://learn.microsoft.com/en-us/sql/connect/ado-net/connection-string-syntax?view=sql-server-ver16 */
  teleskopConnectionString: {
    env: 'TELESKOP_CONNECTION_STRING',
  },
  /** Pino Log Level (debug|info|warn|error|fatal) */
  logLevel: {
    env: ['LOG_LEVEL', 'NUXT_LOG_LEVEL'],
    default: 'info',
  },
  machineStatusMaxAge: {
    env: 'MACHINE_STATUS_MAX_AGE',
    type: 'integer',
    default: 10_000,
  },
  machineParameterNamesMaxAge: {
    env: 'MACHINE_PARAMETER_NAMES_MAX_AGE',
    type: 'integer',
    default: 60_000,
  },
  teleskopTimezoneOffset: {
    env: ['TELESKOP_TIMEZONE_OFFSET', 'NUXT_TELESKOP_TIMEZONE_OFFSET'],
    type: 'integer',
    default: -180,
  },
})

/** Returns `true` if `teleskopConnectionString` is not defined. */
function teleskopRequired(cfg: Record<string, any>) {
  return !cfg.teleskopConnectionString
}
