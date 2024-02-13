import { defineStore } from 'pinia'

export const useColorStore = defineStore('colors', () => {
  const jobOrderStatusColors: Record<number, string> = {
    0: '#007BFF',
    1: '#64ABFC',
    2: '#73CECE',
    3: '#4CAF50',
    4: '#7F72FA',
    8: '#FF4B4B',
    10: '#FFBB00',
  }
  const colors = {
    jobOrderStatusColors,
    darkJobOrderCellEven: '#ACACAC',
    darkJobOrderCellOdd: 'grey',
    lightJobOrderCellEven: 'white',
    lightJobOrderCellOdd: '#CACACA',
    selectedRowLight: '#AFA8F5',
    selectedRowDark: '#1AAAEA',
  }
  return {
    colors,
  }
})
