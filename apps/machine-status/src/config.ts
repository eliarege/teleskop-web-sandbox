import { defineConfiguration } from 'utils'

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
  /** Teleskop bağlantı stringi. Syntax: https://learn.microsoft.com/en-us/sql/connect/ado-net/connection-string-syntax?view=sql-server-ver16 */
  teleskopConnectionString: {
    env: 'TELESKOP_CONNECTION_STRING',
    required: true,
  },
  /** DmExchange bağlantı stringi. Syntax: https://learn.microsoft.com/en-us/sql/connect/ado-net/connection-string-syntax?view=sql-server-ver16 */
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
})
