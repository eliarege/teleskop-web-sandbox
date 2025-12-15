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
        incomplete: 'All fields must be filled out correctly.',
      },
    },
    tr: {
      validation: {
        max({ name, node: { value }, args }) {
          // Shown when the length of the array of user-provided values is longer than the max supplied to the rule.
          if (Array.isArray(value)) {
            return `${name} en fazla ${args[0]} seçenek içerebilir.`
          }
          // Shown when the user-provided value is greater than (or equal to) the maximum number supplied to the rule
          return `${name} en fazla ${args[0]} olabilir.`
        },
        min({ name, node: { value }, args }) {
          // Shown when the length of the array of user-provided values is shorter than the min supplied to the rule.
          if (Array.isArray(value)) {
            return `${name} en az ${args[0]} seçenek içermelidir.`
          }
          // Shown when the user-provided value is less than (or equal to) the minimum number supplied to the rule
          return `${name} en az ${args[0]} olabilir.`
        },
        notStartsWith: ({ name, args }) =>
          `${name} "${args[0]}" ile başlayamaz.`,
      },
      ui: {
        incomplete: 'Tüm alanlar doğru şekilde doldurulmalıdır.',
      },
    },
  },
})
