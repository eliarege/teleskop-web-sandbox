import { defineConfiguration, inferBoolean } from '@teleskop/utils'

export const config = defineConfiguration({
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
    required: inferBoolean(process.env.DMEXCHANGE_ENABLED, false),
  },
  dmExchangePort: {
    env: ['DMEXCHANGE_PORT', 'NUXT_DMEXCHANGE_PORT'],
    type: 'number',
    default: 1433,
  },
  dmExchangeUser: {
    env: ['DMEXCHANGE_USER', 'NUXT_DMEXCHANGE_USER'],
    required: inferBoolean(process.env.DMEXCHANGE_ENABLED, false),
  },
  dmExchangePassword: {
    env: ['DMEXCHANGE_PASSWORD', 'NUXT_DMEXCHANGE_PASSWORD'],
    required: inferBoolean(process.env.DMEXCHANGE_ENABLED, false),
  },
  dmExchangeDatabase: {
    env: ['DMEXCHANGE_DATABASE', 'NUXT_DMEXCHANGE_DATABASE'],
    required: inferBoolean(process.env.DMEXCHANGE_ENABLED, false),
  },
  dmExchangeInstanceName: {
    env: ['DMEXCHANGE_INSTANCE_NAME', 'NUXT_DMEXCHANGE_INSTANCE_NAME'],
  },
  /** Extra Querystring connection options */
  dmExchangeConnectionOptions: {
    env: ['DMEXCHANGE_CONNECTION_OPTIONS', 'NUXT_DMEXCHANGE_CONNECTION_OPTIONS'],
    type: 'querystring',
  },

  /** Pino Log Level (debug|info|warn|error|fatal) */
  logLevel: {
    env: ['LOG_LEVEL', 'NUXT_LOG_LEVEL'],
    default: 'info',
  },
  enableLegacyMigrations: {
    env: ['ENABLE_LEGACY_MIGRATIONS'],
    type: 'boolean',
    default: false,
  },
})
