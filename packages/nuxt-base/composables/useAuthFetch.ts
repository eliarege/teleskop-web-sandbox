import type { UseFetchOptions } from 'nuxt/app'
import { setHeader } from '~/utils/ofetch'

export interface UseAuthFetchOptions<T> extends UseFetchOptions<T> {
  minimumTokenValidity?: number
}

export const useAuthFetch: typeof useFetch = <T>(url: string | (() => string), options?: UseAuthFetchOptions<T>) => {
  const keycloak = useKeycloak()
  return useFetch(url, { ...options, $fetch: keycloak.fetch })
}
