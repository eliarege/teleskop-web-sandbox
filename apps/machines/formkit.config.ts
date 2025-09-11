import { en, tr } from '@formkit/i18n'
import { defaultConfig } from '@formkit/vue'
import { createValidationPlugin } from '@formkit/validation'
import type { FormKitNode } from '@formkit/core'

function notStartsWith(node: FormKitNode, ...args: string[]): boolean {
  if (!node.value)
    return true
  const value = String(node.value)
  const forbidden = args[0] ?? ''
  return !value.startsWith(forbidden)
}
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  if (match)
    return decodeURIComponent(match[2])
  return null
}

const appLocale = getCookie('teleskop_locale') || 'en-GB'

export default defaultConfig({
  locales: { tr, en },
  locale: appLocale,
  plugins: [createValidationPlugin({ notStartsWith })],
  messages: {
    en: {
      validation: {
        notStartsWith: ({ name, args }) =>
          `${name} cannot start with "${args[0]}".`,
      },
      ui: {
        incomplete: 'Sorry, not all fields are filled out correctly.',
      },
    },
    tr: {
      validation: {
        notStartsWith: ({ name, args }) =>
          `${name} "${args[0]}" ile başlayamaz.`,
      },
      ui: {
        incomplete: 'Üzgünüz, tüm alanlar doğru şekilde doldurulmamış.',
      },
    },
  },
})
