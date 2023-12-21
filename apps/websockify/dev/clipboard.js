import process from 'node:process'
import clipboard from 'clipboardy'
import { pino } from 'pino'

const logger = pino({ name: 'dev' })

const TRUE_RE = /^(?:y|yes|true|on)$/i
const FALSE_RE = /^(?:no?|false|off)$/i

function inferBoolean(value) {
  if (!value)
    return false
  if (TRUE_RE.test(value))
    return true
  if (FALSE_RE.test(value))
    return false
  throw new TypeError(`Expected boolean value, got ${value}`)
}

const useClipboard = inferBoolean(process.env.KC_DEV_TOKEN_CLIPBOARD)

if (useClipboard) {
  const token = clipboard.readSync()
  logger.info(`Copied clipboard to KC_DEV_TOKEN. Copied value: ${token.slice(0, 20)}...`)
  process.env.KC_DEV_TOKEN = token
}
