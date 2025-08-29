import { en, tr } from '@formkit/i18n'
import { defaultConfig } from '@formkit/vue'
import { createValidationPlugin } from '@formkit/validation'
import type { FormKitNode } from '@formkit/core'

function notStartsWith(node: FormKitNode, ...args: string[]): boolean {
  if (!node.value)
    return true
  const value = String(node.value)
  return !args.some(forbidden => value.startsWith(forbidden))
}

export default defaultConfig({
  locales: { tr, en },
  locale: 'en-GB',
  plugins: [createValidationPlugin({ notStartsWith })],
  messages: {
    en: {
      validation: {
        notStartsWith: ({ name, args }) => `${name} cannot start with "${args}".`,
      },
    },
    tr: {
      validation: {
        notStartsWith: ({ name, args }) => `${name} "${args}" ile başlayamaz.`,
      },
    },
  },
})
