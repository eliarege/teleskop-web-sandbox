import type { AppProperties } from '~/types'

/** Return read-only details about the app */
export function useAppProps() {
  return useNuxtApp().$appProps as AppProperties
}
