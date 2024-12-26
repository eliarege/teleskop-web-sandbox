import type { UseFetchOptions } from 'nuxt/app'

export const useAuthFetch: typeof useFetch = <T>(url: string | (() => string), options?: UseFetchOptions<T>) => {
  const keycloak = useKeycloak()
  return useFetch(url, { ...options, $fetch: keycloak.fetch })
}
