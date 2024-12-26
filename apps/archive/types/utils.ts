const parsed: unique symbol = Symbol('parsed')
type Primitive = string | number | boolean | bigint | symbol | undefined | null
type Builtin = Primitive | Function | Date | Error | RegExp

export type Duo<Parsed, Raw> = { [parsed]: true, type: Parsed } | { [parsed]: false, type: Raw }

export type DDate = Duo<Date, string>

export type NullableDDate = Duo<Date | null, string | null>

export type DuoRaw<T> = T extends Builtin
  ? T
  : T extends { [parsed]: boolean, type: any }
    ? Exclude<T, { [parsed]: true }>['type']
    : T extends NonNullable<unknown>
      ? { [K in keyof T]: DuoRaw<T[K]> }
      : never

export type DuoParsed<T> = T extends Builtin
  ? T
  : T extends { [parsed]: boolean, type: any }
    ? Exclude<T, { [parsed]: false }>['type']
    : T extends NonNullable<unknown>
      ? { [K in keyof T]: DuoParsed<T[K]> }
      : never

export type DuoAny<T> = T extends Builtin
  ? T
  : T extends { [parsed]: boolean, type: any }
    ? T['type']
    : T extends NonNullable<unknown>
      ? { [K in keyof T]: DuoAny<T[K]> }
      : never
