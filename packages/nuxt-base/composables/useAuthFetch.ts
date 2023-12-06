import type { UseFetchOptions } from 'nuxt/app'

export interface UseAuthFetchOptions<T> extends UseFetchOptions<T> {
  minimumTokenValidity: number
}

export function useAuthFetch<T>(url: string | (() => string), options?: UseAuthFetchOptions<T>) {
  const config = useAppConfig()
  const keycloak = useKeycloak()
  const onRequest: UseFetchOptions<T>['onRequest'] = async (context) => {
    await keycloak.updateToken(options?.minimumTokenValidity || config.minimumTokenValidity)
    setHeader(context.options, 'Authorization', `Bearer ${keycloak.token.value}`)
    if (typeof options?.onRequest === 'function') {
      await options.onRequest(context)
    }
  }

  return useFetch(url, { ...options, onRequest })
}

function setHeader(init: Omit<RequestInit, 'body'>, name: string, value: string): void {
  if (Array.isArray(init.headers)) {
    init.headers.push([name, value])
  } else if (init.headers instanceof Headers) {
    init.headers.set(name, value)
  } else {
    init.headers ||= {}
    init.headers[name] = value
  }
}
