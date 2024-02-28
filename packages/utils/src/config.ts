import process from 'node:process'
import { inferBoolean, isDef } from './base'

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

export function defineConfiguration<const T extends Record<string, ConfigProps>>(config: T): InferConfigObject<T> {
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
