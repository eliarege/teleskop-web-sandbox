import { defineConfiguration } from '@teleskop/utils'

export const config = defineConfiguration({
  teleskopHost: {
    env: 'TELESKOP_HOST',
    required: true,
  },
  teleskopPort: {
    env: 'TELESKOP_PORT',
    type: 'number',
    default: 1433,
  },
  teleskopUser: {
    env: 'TELESKOP_USER',
    required: true,
  },
  teleskopPassword: {
    env: 'TELESKOP_PASSWORD',
    required: true,
  },
  teleskopDatabase: {
    env: 'TELESKOP_DATABASE',
    required: true,
  },
  teleskopInstanceName: {
    env: 'TELESKOP_INSTANCE_NAME',
  },
  /** Extra Querystring connection options */
  teleskopConnectionOptions: {
    env: 'TELESKOP_CONNECTION_OPTIONS',
    type: 'querystring',
  },
  /** Pino Log Level (debug|info|warn|error|fatal) */
  logLevel: {
    env: 'LOG_LEVEL',
    default: 'info',
  },
})
