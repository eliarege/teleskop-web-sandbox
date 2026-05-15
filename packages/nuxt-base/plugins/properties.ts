import type { AppProperties } from '../types'

export default defineNuxtPlugin(async () => {
  const appProps = await $fetch<AppProperties>('/api/properties')

  return {
    provide: {
      appProps,
    },
  }
})
