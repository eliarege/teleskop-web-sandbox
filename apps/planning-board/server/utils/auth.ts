import type { H3Event } from 'h3'

export function useKcFetch(event: H3Event) {
  const token = getHeader(event, 'authorization')

  if (!token)
    throw createError({ statusCode: 401 })

  return $fetch.create({
    headers: {
      authorization: token,
    },
  })
}
