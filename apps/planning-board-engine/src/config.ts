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
  /**
   * Teleskop veri tabanında tutulan `datetime` değerleri genellikle teleskop uygulamalarının çalıştığı sistemin saatine göre kaydedilmektedir.
   * Burdaki sayı değeri, bu farkı ortadan kaldırmak için kullanılmaktadır.
   */
  teleskopTimezoneOffset: {
    env: 'TELESKOP_TIMEZONE_OFFSET',
    type: 'integer',
    default: -180,
  },
})
