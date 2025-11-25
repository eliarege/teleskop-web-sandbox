import { defineConfiguration } from '@teleskop/utils'

export const config = defineConfiguration({
  serverPort: {
    env: ['SERVER_PORT'],
    type: 'number',
    default: 3500,
  },
  serverHost: {
    env: ['SERVER_HOST'],
    type: 'string',
    default: '0.0.0.0',
  },
  keycloakUrl: {
    default: 'http://localhost:8080',
    type: 'string',
    env: ['KC_URL', 'NUXT_PUBLIC_KC_URL'],
  },
  keycloakRealm: {
    default: 'teleskop-web',
    type: 'string',
    env: ['KC_REALM', 'NUXT_PUBLIC_KC_REALM'],
  },
  keycloakClientId: {
    default: 'planning-board-engine',
    type: 'string',
    env: ['KC_CLIENT_ID', 'NUXT_PUBLIC_KC_CLIENT_ID'],
  },
  keycloakEnabled: {
    type: 'boolean',
    env: ['KC_ENABLED', 'NUXT_PUBLIC_KC_ENABLED'],
    default: false,
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
  /**
   * Teleskop veri tabanında tutulan `datetime` değerleri genellikle teleskop uygulamalarının çalıştığı sistemin saatine göre kaydedilmektedir.
   * Burdaki sayı değeri, bu farkı ortadan kaldırmak için kullanılmaktadır.
   */
  teleskopTimezoneOffset: {
    env: ['TELESKOP_TIMEZONE_OFFSET', 'NUXT_TELESKOP_TIMEZONE_OFFSET'],
    type: 'integer',
    default: -180,
  },
})
