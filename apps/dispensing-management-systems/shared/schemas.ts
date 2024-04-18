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
