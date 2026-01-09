import { z } from 'zod'

const IPV4_RE = /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/

export const machineSchema = z.object({
  machineId: z.number().int(),
  machineCode: z.string().min(1),
  groupId: z.union([z.number(), z.string()]),
  tbbModel: z.string().min(1),
  machineCapacity: z.number(),
  reelCount: z.number().int(),
  nozzleCount: z.number().int(),
  ip: z.string().regex(IPV4_RE, 'Invalid IP address'),
  theoricalCharge: z.number().int().min(1).max(25),
  theoricalChargeDuration: z.number().int().min(45).max(1440),
  steamUnit: z.string().optional(),
  MTTempIo: z.union([z.number(), z.string()]).optional(),
  inUse: z.boolean(),
  storeElectricityAsInc: z.boolean().optional(),
  theoreticalWater: z.boolean().optional(),
  additionalTank1: z.boolean(),
  additionalTank2: z.boolean().optional(),
  additionalTank3: z.boolean().optional(),
  additionalTank4: z.boolean().optional(),
  reserveTank: z.boolean(),
  theoreticalSteam: z.boolean().optional(),
  steamKgPerHour: z.number().optional(),
  steamValveDo: z.union([z.number(), z.string()]).optional(),
  version: z.string().optional(),
}).refine((data) => {
  // Theoretical charge rule: theoricalCharge * theoricalChargeDuration <= 1440
  if (data.theoricalCharge && data.theoricalChargeDuration) {
    return data.theoricalCharge * data.theoricalChargeDuration <= 1440
  }
  return true
}, {
  message: 'Theoretical charge exceeds 1 day',
  path: ['theoricalCharge'],
})
