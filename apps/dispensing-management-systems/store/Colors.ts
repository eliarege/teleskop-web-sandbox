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
  const darkJobOrderCellEven = '#ACACAC'
  const darkJobOrderCellOdd = 'grey'
  const lightJobOrderCellEven = 'white'
  const lightJobOrderCellOdd = '#CACACA'
  return {
    jobOrderStatusColors,
    darkJobOrderCellEven,
    darkJobOrderCellOdd,
    lightJobOrderCellEven,
    lightJobOrderCellOdd,
  }
})
