export type ValueOf<T> = T[keyof T]
export type TableRecord<T extends Record<string, string>> = Partial<Record<ValueOf<T>, unknown>>
