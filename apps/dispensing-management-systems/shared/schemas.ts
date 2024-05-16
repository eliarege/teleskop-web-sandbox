import { z } from 'zod'

export const DispenserSchema = z.object({
  dispenserId: z.number(),
  dispenserName: z.string(),
  dispenserIP: z.string().ip(),
  dispenserType: z.number().nullable(),
  dispenserBrandId: z.number(),
  dispenserBrandName: z.string(),
  vncUser: z.string().nullable(),
  vncPassword: z.string().nullable(),
  vncPort: z.number().nullable(),
  lastConsumptionControl: z.string().nullable(),
  protocol: z.string(),
  protocolFields: z.unknown().nullable(),
  JDMConnections: z.array(z.number()).nullable(),
})

export const MachineSchema = z.object({
  machineId: z.number(),
  machineName: z.string(),
  controllerType: z.number(),
  connectedDispensers: z.array(z.any()).nullable()
})

export const MaterialSchema = z.object({
  materialCode: z.string(),
  materialName: z.string(),
  materialGroupNo: z.number(),
  density: z.number(),
  ph: z.number(),
  source: z.string().nullable(),
  costUnit: z.string().nullable(),
  unitCost: z.number().nullable(),
  reRequestable: z.boolean(),
  directTransfer: z.boolean(),
  connectedDispensers: z.array(z.any()).nullable()
})
