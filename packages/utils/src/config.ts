import { inferBoolean, isDef, tryJsonParse } from './base'

export type ConfigProps = {
  env: string | [string, ...string[]]
  required?: boolean | ((config: Record<string, any>) => boolean)
} & (
  | StringConfigProps
  | NumberConfigProps
  | BooleanConfigProps
  | QuerystringConfigProps
)

interface StringConfigProps {
  type?: 'string' | 'url'
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

interface QuerystringConfigProps {
  type: 'querystring'
  default?: Record<string, any>
}

type InferRequired<Type, Props extends ConfigProps> =
  Props extends { required: true } ? RuntimeValue<Type, `You can configure this value by setting the env ${Props['env'][0]}`>
    : Props extends { default: Type } ? RuntimeValue<Type, `You can configure this value by setting the env ${Props['env'][0]}`>
      : RuntimeValue<Type, `You can configure this value by setting the env ${Props['env'][0]}`> | undefined

type InferConfigObject<T extends Record<string, ConfigProps>> = {
  readonly [K in keyof T]: T[K] extends { type: 'number' | 'integer' } ? InferRequired<number, T[K]>
    : T[K] extends { type: 'boolean' } ? InferRequired<boolean, T[K]>
      : T[K] extends { type: 'querystring' } ? InferRequired<Record<string, any>, T[K]>
        : InferRequired<string, T[K]>
}
declare const message: unique symbol
type RuntimeValue<Type, Message extends string> = Type & {
  [message]: Message
}

export function defineConfiguration<const T extends Record<string, ConfigProps>>(config: T): InferConfigObject<T> {
  const output = {} as Record<string, any>
  /* eslint-disable-next-line node/prefer-global/process */
  const process = globalThis.process
  if (!process)
    throw new Error(`Can only run in node environment`)

  // Array of configurations where the value is `undefined` but the `required` property is a function
  const postRequiredChecks = [] as (ConfigProps & { required: Extract<ConfigProps['required'], Function> })[]

  for (const [key, props] of Object.entries(config)) {
    const type = props.type || 'string'
    const env = Array.isArray(props.env) ? props.env : [props.env]
    // Find the first env that is defined
    const rawValue = env.map(e => process.env[e]).find(Boolean)

    if (props.required && !isDef(props.default) && !isDef(rawValue)) {
      if (typeof props.required === 'boolean') {
        /* eslint-disable-next-line unicorn/prefer-type-error */
        throw new Error(`Missing env ${type}: ${props.env}`)
      } else if (typeof props.required === 'function') {
        postRequiredChecks.push(props as (typeof postRequiredChecks)[0])
      }
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
      } else if (type === 'querystring') {
        value = Object.fromEntries([
          ...new URLSearchParams(rawValue).entries(),
        ].map(([k, v]) => [k, tryJsonParse(v)]))
      } else {
        value = rawValue
        if (type === 'url' && !isValidURL(rawValue)) {
          throw new TypeError(`Invalid ${type}: ${props.env}`)
        }
      }
    } else if (props.default) {
      value = props.default
    }
    output[key] = value
  }

  // Check
  for (const props of postRequiredChecks) {
    if (props.required(config)) {
      throw new Error(`Missing env ${props.type || 'string'}: ${props.env}`)
    }
  }
  return output as InferConfigObject<T>
}

function isValidURL(value: string): boolean {
  try {
    const _ = new URL(value)
    return true
  } catch (err) {
    return false
  }
}
