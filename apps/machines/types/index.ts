export interface Machine {
  no: boolean
  name: string
  group: string
  model: string
  ip: string
  theoricalCharge: string
  theoricalChargeDuration: string
  machineCapacity: string
  reelCount: number
  nozzleCount: number
  steamUnit: string
  steamKgPerHour: number
  additionalTank1: boolean
  additionalTank2: boolean
  additionalTank3: boolean
  additionalTank4: boolean
  reserveTank: boolean
  inUse: boolean
  MTTempIo: Array<string>
}
