import { z } from 'zod'

export const BatchNoSchema = z.string()
  .min(1, 'Batch number is required')
  .max(50, 'Batch number must be 50 characters or less')
  .regex(/^[a-zA-Z0-9_]+$/, 'Batch number must contain only alphanumeric characters and underscores')

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
  machineGroup: z.number().nullable(),
  controllerType: z.number(),
  capacity: z.number().nullable(),
  connectedDispensers: z.array(z.any()).nullable(),
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
  isManual: z.boolean(),
  connectedDispensers: z.array(z.any()).nullable(),
})
