import { defineStore } from 'pinia'
import { StatusCodes } from '~/shared/constants'

export const useColorStore = defineStore('colors', () => {
  const jobOrderStatusColors: Record<StatusCodes, string> = {
    [StatusCodes.newRequest]: '#007BFF',
    [StatusCodes.inDispenser]: '#64ABFC',
    [StatusCodes.inProcess]: '#73CECE',
    [StatusCodes.requestCompleted]: '#4CAF50',
    [StatusCodes.priorityChanged]: '#7F72FA',
    [StatusCodes.canceled]: '#FF4B4B',
    [StatusCodes.dispenserChanged]: '#FFBB00',
  }

  const colors = {
    jobOrderStatusColors,
    darkJobOrderCellEven: '#ACACAC',
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
