import { defineStore } from 'pinia'
import { StatusCodes } from '~/shared/constants'

export const useColorStore = defineStore('colors', () => {
  const jobOrderStatusColors: Record<StatusCodes, string> = {
    [StatusCodes.newRequest]: '#FFFFFF',
    [StatusCodes.inDispenser]: '#FFFF00',
    [StatusCodes.inProcess]: '#0000FF',
    [StatusCodes.requestCompleted]: '#008000',
    [StatusCodes.priorityChanged]: '#808080',
    [StatusCodes.canceled]: '#FF0000',
    [StatusCodes.dispenserChanged]: '#FFA500',
  }
  const colors = {
    jobOrderStatusColors,
    darkJobOrderCellEven: 'white',
    darkJobOrderCellOdd: 'grey',
    lightJobOrderCellEven: 'white',
    lightJobOrderCellOdd: '#CACACA',
    selectedRowLight: '#1AAAEA',
    selectedRowDark: 'var(--q-primary)',
  }
  return {
    colors,
  }
})
