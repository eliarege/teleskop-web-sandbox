import type { H3Event } from 'h3'

const config = useRuntimeConfig()

export function useKcFetch(event: H3Event) {
  if (!config.public.kcEnabled) {
    return $fetch
  }

  const token = getHeader(event, 'authorization')

  if (!token)
    throw createError({ statusCode: 401 })

  return $fetch.create({
    headers: {
      authorization: token,
    },
  })
}
