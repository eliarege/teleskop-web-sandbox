import type { H3Event } from 'h3'

export function hasRole(event: H3Event, role: string): boolean {
  const config = useRuntimeConfig()
  if (config.public.kcEnabled) {
    const roles = event.context.kauth?.resource_access?.[config.public.kcClientId].roles || []
    return roles.includes(role)
  } else {
    return true
  }
}

export function checkPermission(event: any, role: string) {
  if (!hasRole(event, role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have permission to perform this action.',
    })
  }
}
