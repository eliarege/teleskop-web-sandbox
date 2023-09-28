import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

export const useColorStore = defineStore('colors', () => {
  // defaults
  // TODO: Add Color Theme
  const bgColor = useStorage('bgColor', '#FFFFFF')
  const textcolor = useStorage('textcolor', '#000000')
  const cardActiveBg = useStorage('cardActiveBg', '#4B5563')
  const cardIdleBg = useStorage('cardIdleBg', '#D1D5DB')
  const cardItemBg = useStorage('cardItemBg', '#000000')

  return {
    bgColor,
    textcolor,
    cardActiveBg,
    cardIdleBg,
    cardItemBg,
  }
})
