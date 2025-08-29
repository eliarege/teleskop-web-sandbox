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
    env: 'TELESKOP_HOST',
    required: teleskopRequired,
  },
  teleskopPort: {
    env: 'TELESKOP_PORT',
    type: 'number',
    default: 1433,
  },
  teleskopUser: {
    env: 'TELESKOP_USER',
    required: teleskopRequired,
  },
  teleskopPassword: {
    env: 'TELESKOP_PASSWORD',
    required: teleskopRequired,
  },
  teleskopDatabase: {
    env: 'TELESKOP_DATABASE',
    required: teleskopRequired,
  },
  teleskopInstanceName: {
    env: 'TELESKOP_INSTANCE_NAME',
  },
  /** Extra Querystring connection options */
  teleskopConnectionOptions: {
    env: 'TELESKOP_CONNECTION_OPTIONS',
    type: 'querystring',
  },
  /** Teleskop Connection String. Syntax: https://learn.microsoft.com/en-us/sql/connect/ado-net/connection-string-syntax?view=sql-server-ver16 */
  teleskopConnectionString: {
    env: 'TELESKOP_CONNECTION_STRING',
  },
  /** If `dmExchangeConnectionString` is set, its considered enabled */
  dmExchangeEnabled: {
    env: 'DMEXCHANGE_ENABLED',
    type: 'boolean',
    default: false,
  },
  dmExchangeHost: {
    env: 'DMEXCHANGE_HOST',
    required: dmExchangeRequired,
  },
  dmExchangePort: {
    env: 'DMEXCHANGE_PORT',
    type: 'number',
    default: 1433,
  },
  dmExchangeUser: {
    env: 'DMEXCHANGE_USER',
    required: dmExchangeRequired,
  },
  dmExchangePassword: {
    env: 'DMEXCHANGE_PASSWORD',
    required: dmExchangeRequired,
  },
  dmExchangeDatabase: {
    env: 'DMEXCHANGE_DATABASE',
    required: dmExchangeRequired,
  },
  dmExchangeInstanceName: {
    env: 'DMEXCHANGE_INSTANCE_NAME',
  },
  dmExchangeConnectionOptions: {
    env: 'DMEXCHANGE_CONNECTION_OPTIONS',
    type: 'querystring',
  },
  /** DmExchange Connection String. Syntax: https://learn.microsoft.com/en-us/sql/connect/ado-net/connection-string-syntax?view=sql-server-ver16 */
  dmExchangeConnectionString: {
    env: 'DMEXCHANGE_CONNECTION_STRING',
  },
  /** Pino Log Level (debug|info|warn|error|fatal) */
  logLevel: {
    env: 'LOG_LEVEL',
    default: 'info',
  },
  machineStatusMaxAge: {
    env: 'MACHINE_STATUS_MAX_AGE',
    type: 'integer',
    default: 10_000,
  },
  machineErpMappingsMaxAge: {
    env: 'MACHINE_ERP_MAPPINGS_MAX_AGE',
    type: 'integer',
    default: 3600_000,
  },
  jobOrderErpParametersMaxAge: {
    env: 'JOB_ORDER_ERP_PARAMETERS_MAX_AGE',
    type: 'integer',
    default: 60_000,
  },
  teleskopTimezoneOffset: {
    env: 'TELESKOP_TIMEZONE_OFFSET',
    type: 'integer',
    default: -180,
  },
})

/** Returns `true` if `teleskopConnectionString` is not defined. */
function teleskopRequired(cfg: Record<string, any>) {
  return !cfg.teleskopConnectionString
}

/** Returns `true` if dmExchange is enabled and `dmExchangeConnectionString` is not defined. */
function dmExchangeRequired(cfg: Record<string, any>) {
  return cfg.dmExchangeEnabled && !cfg.dmExchangeConnectionString
}
