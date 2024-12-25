import { useStorage } from '@vueuse/core'

export default defineNuxtPlugin(() => {
  const { dark } = useQuasar()
  const darkMode = useStorage<'auto' | boolean>('theme', 'auto', localStorage)
  dark.set(darkMode.value)
})
