import { en, tr } from '@formkit/i18n'
import { defaultConfig } from '@formkit/vue'
import { createValidationPlugin } from '@formkit/validation'
import type { FormKitNode } from '@formkit/core'

function notStartsWithZero(node: FormKitNode): boolean {
  if (!node.value)
    return true
  return !String(node.value).startsWith('0')
}

export default defaultConfig({
  locales: { tr, en },
  locale: 'en-GB',
  plugins: [createValidationPlugin({ notStartsWithZero })],
  messages: {
    en: {
      validation: {
        notStartsWithZero: 'Password cannot start with 0.',
      },
    },
    tr: {
      validation: {
        notStartsWithZero: 'Şifre 0 ile başlayamaz.',
      },
    },
  },
})
