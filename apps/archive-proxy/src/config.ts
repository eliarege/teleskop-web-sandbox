import { defineConfiguration } from '@teleskop/utils'

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
  /** Pino Log Level (debug|info|warn|error|fatal) */
  logLevel: {
    env: 'LOG_LEVEL',
    default: 'info',
  },
  teleskopArchiveUrl: {
    env: ['TELESKOP_ARCHIVE_URL', 'NUXT_TELESKOP_ARCHIVE_URL'],
    type: 'url',
    required: true,
  },
})
