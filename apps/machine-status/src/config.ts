import process from 'node:process'
import { inferBoolean } from 'utils'
import { isDef } from './utils'

export type ConfigProps = {
  env: string
  required?: boolean
} & (
  | StringConfigProps
  | NumberConfigProps
  | BooleanConfigProps
)

interface StringConfigProps {
  type?: 'string'
  default?: string
}

interface NumberConfigProps {
  type: 'integer' | 'number'
  default?: number
}
interface BooleanConfigProps {
  type: 'boolean'
  default?: boolean
}

type InferRequired<Type, Props extends ConfigProps> =
  Props extends { required: true } ? RuntimeValue<Type, `You can configure this value by setting the env ${Props['env']}`>
    : Props extends { default: Type } ? RuntimeValue<Type, `You can configure this value by setting the env ${Props['env']}`>
      : RuntimeValue<Type, `You can configure this value by setting the env ${Props['env']}`> | undefined

type InferConfigObject<T extends Record<string, ConfigProps>> = {
  readonly [K in keyof T]: T[K] extends { type: 'number' | 'integer' } ? InferRequired<number, T[K]>
    : T[K] extends { type: 'boolean' } ? InferRequired<boolean, T[K]>
      : InferRequired<string, T[K]>
}
declare const message: unique symbol
type RuntimeValue<Type, Message extends string> = Type & {
  [message]: Message
}

// TODO: Move this to workspace utils
function defineConfiguration<const T extends Record<string, ConfigProps>>(config: T): InferConfigObject<T> {
  const output = {} as Record<string, any>
  for (const [key, props] of Object.entries(config)) {
    const type = props.type || 'string'
    const rawValue = process.env[props.env]
    if (!isDef(rawValue) && props.required && !isDef(props.default)) {
      throw new Error(`Missing env ${type}: ${props.env}`)
    }
    let value: any
    if (rawValue) {
      if (type === 'integer') {
        value = Number.parseInt(rawValue)
        if (Number.isNaN(value)) {
          throw new TypeError(`Invalid ${type}: ${props.env}`)
        }
      } else if (type === 'number') {
        value = Number.parseFloat(rawValue)
        if (Number.isNaN(value)) {
          throw new TypeError(`Invalid ${type}: ${props.env}`)
        }
      } else if (type === 'boolean') {
        value = inferBoolean(rawValue)
      } else {
        value = rawValue
      }
    } else if (props.default) {
      value = props.default
    }
    output[key] = value
  }
  return output as InferConfigObject<T>
}
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
  /** Teleskop bağlantı stringi. Syntax: https://learn.microsoft.com/en-us/sql/connect/ado-net/connection-string-syntax?view=sql-server-ver16 */
  teleskopConnectionString: {
    env: 'TELESKOP_CONNECTION_STRING',
    required: true,
  },
  /** DmExchange bağlantı stringi. Syntax: https://learn.microsoft.com/en-us/sql/connect/ado-net/connection-string-syntax?view=sql-server-ver16 */
  dmExchangeConnectionString: {
    env: 'DMEXCHANGE_CONNECTION_STRING',
  },
  /** Pino Log Level (debug|info|warn|error|fatal) */
  logLevel: {
    env: 'LOG_LEVEL',
    default: 'info',
  },
  machineStatusMaxAge: {
    env: 'MACHINE_STATUS_MAX_AGE',
    type: 'integer',
    default: 10_000,
  },
  machineErpMappingsMaxAge: {
    env: 'MACHINE_ERP_MAPPINGS_MAX_AGE',
    type: 'integer',
    default: 3600_000,
  },
  jobOrderErpParametersMaxAge: {
    env: 'JOB_ORDER_ERP_PARAMETERS_MAX_AGE',
    type: 'integer',
    default: 60_000,
  },
})
