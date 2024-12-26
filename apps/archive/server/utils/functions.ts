import { z } from 'zod'
import type { H3Event } from 'h3'

const routerParamSchema = z.object({
  batchkey: z.number({ coerce: true }).int().positive(),
})

export function getBatchKeyParam(event: H3Event): number {
  const routerParams = getRouterParams(event)
  const result = routerParamSchema.safeParse(routerParams)
  if (result.success) {
    return result.data.batchkey
  } else {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: result.error.format(),
    })
  }
}

const sinceQuerySchema = z.object({
  since: z.string().datetime().optional(),
})

export function getSinceQuery(event: H3Event): Date | null {
  const query = getQuery(event)
  const result = sinceQuerySchema.safeParse(query)
  if (result.success) {
    const since = result.data.since
    return since && new Date(since) || null
  } else {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: result.error.format(),
    })
  }
}

export function pick<T extends Record<string, any>>(object: T, keys: (keyof T)[]) {
  const result = {} as T
  for (const key of keys) {
    result[key] = object[key]
  }
  return result
}

export function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1]
}
