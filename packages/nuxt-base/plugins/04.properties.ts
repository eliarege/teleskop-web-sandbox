import { useStorage } from '@vueuse/core'
import type { AppProperties } from '~/types'

export default defineNuxtPlugin(async () => {
  const { dark } = useQuasar()
  const appProps = await $fetch<AppProperties>('/api/properties')

  const darkMode = useStorage<'auto' | boolean>(`${appProps.name}.theme`, false, localStorage)
  dark.set(darkMode.value)

  return {
    provide: {
      appProps,
    },
  }
})
