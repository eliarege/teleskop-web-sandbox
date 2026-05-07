import { defineConfiguration } from '@teleskop/utils'

export type Config = ReturnType<typeof buildConfig>

export function buildConfig() {
  return defineConfiguration({
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
      required: true,
    },
    teleskopPort: {
      env: ['TELESKOP_PORT', 'NUXT_TELESKOP_PORT'],
      type: 'number',
      default: 1433,
    },
    teleskopUser: {
      env: ['TELESKOP_USER', 'NUXT_TELESKOP_USER'],
      required: true,
    },
    teleskopPassword: {
      env: ['TELESKOP_PASSWORD', 'NUXT_TELESKOP_PASSWORD'],
      required: true,
    },
    teleskopDatabase: {
      env: ['TELESKOP_DATABASE', 'NUXT_TELESKOP_DATABASE'],
      required: true,
    },
    teleskopInstanceName: {
      env: ['TELESKOP_INSTANCE_NAME', 'NUXT_TELESKOP_INSTANCE_NAME'],
    },
    /** Extra Querystring connection options */
    teleskopConnectionOptions: {
      env: ['TELESKOP_CONNECTION_OPTIONS', 'NUXT_TELESKOP_CONNECTION_OPTIONS'],
      type: 'querystring',
    },
    dmExchangeEnabled: {
      env: ['DMEXCHANGE_ENABLED', 'NUXT_DMEXCHANGE_ENABLED'],
      type: 'boolean',
      default: false,
    },
    dmExchangeHost: {
      env: ['DMEXCHANGE_HOST', 'NUXT_DMEXCHANGE_HOST'],
      required: dmExchangeRequired,
    },
    dmExchangePort: {
      env: ['DMEXCHANGE_PORT', 'NUXT_DMEXCHANGE_PORT'],
      type: 'integer',
      default: 1433,
    },
    dmExchangeUser: {
      env: ['DMEXCHANGE_USER', 'NUXT_DMEXCHANGE_USER'],
      required: dmExchangeRequired,
    },
    dmExchangePassword: {
      env: ['DMEXCHANGE_PASSWORD', 'NUXT_DMEXCHANGE_PASSWORD'],
      required: dmExchangeRequired,
    },
    dmExchangeDatabase: {
      env: ['DMEXCHANGE_DATABASE', 'NUXT_DMEXCHANGE_DATABASE'],
      default: 'DmExchange',
    },
    dmExchangeInstanceName: {
      env: ['DMEXCHANGE_INSTANCE_NAME', 'NUXT_DMEXCHANGE_INSTANCE_NAME'],
    },
    dmExchangeConnectionOptions: {
      env: ['DMEXCHANGE_CONNECTION_OPTIONS', 'NUXT_DMEXCHANGE_CONNECTION_OPTIONS'],
      type: 'querystring',
    },
    /** Pino Log Level (debug|info|warn|error|fatal) */
    logLevel: {
      env: ['LOG_LEVEL', 'NUXT_LOG_LEVEL'],
      default: 'info',
    },
    teleskopTimezoneOffset: {
      env: ['TELESKOP_TIMEZONE_OFFSET', 'NUXT_TELESKOP_TIMEZONE_OFFSET'],
      type: 'integer',
      default: -180,
    },
    /** Base URL of the Planning Board API (e.g. http://planning-board:3000). Optional — steps that use it are skipped when absent. */
    planningBoardUrl: {
      env: ['PLANNING_BOARD_URL', 'NUXT_PLANNING_BOARD_URL'],
    },
    /** Interval in milliseconds between event polling cycles per machine. */
    eventPollingInterval: {
      env: ['EVENT_POLLING_INTERVAL', 'NUXT_EVENT_POLLING_INTERVAL'],
      type: 'integer',
      default: 5000,
    },
    /** Interval in milliseconds between machine list refresh cycles (add/remove detection). */
    machineRefreshInterval: {
      env: ['MACHINE_REFRESH_INTERVAL', 'NUXT_MACHINE_REFRESH_INTERVAL'],
      type: 'integer',
      default: 30000,
    },
    /** Interval in milliseconds between DM response polling cycles. */
    dmResponsePollingInterval: {
      env: ['DM_RESPONSE_POLLING_INTERVAL', 'NUXT_DM_RESPONSE_POLLING_INTERVAL'],
      type: 'integer',
      default: 2000,
    },
    /**
     * Minimum elapsed time in milliseconds between two digital IO snapshots in the same poll cycle.
     * Digital IO changes within this window are merged into a single row.
     * Set to 0 to flush on every timestamp change (no merging).
     */
    digitalIoFlushInterval: {
      env: ['DIGITAL_IO_FLUSH_INTERVAL', 'NUXT_DIGITAL_IO_FLUSH_INTERVAL'],
      type: 'integer',
      default: 200,
    },
  }).parse()
}

function dmExchangeRequired(cfg: Record<string, any>) {
  return cfg.dmExchangeEnabled
}
