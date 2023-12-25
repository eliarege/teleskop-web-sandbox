import type { UseFetchOptions } from 'nuxt/app'
import { setHeader } from '~/utils/ofetch'

export interface UseAuthFetchOptions<T> extends UseFetchOptions<T> {
  minimumTokenValidity?: number
}

export function useAuthFetch<T>(url: string | (() => string), options?: UseAuthFetchOptions<T>) {
  const keycloak = useKeycloak()
  const onRequest: UseFetchOptions<T>['onRequest'] = async (context) => {
    await keycloak.updateToken(options?.minimumTokenValidity)
    setHeader(context.options, 'Authorization', `Bearer ${keycloak.token.value}`)
    if (typeof options?.onRequest === 'function') {
      await options.onRequest(context)
    }
  }

  return useFetch(url, { ...options, onRequest })
}
