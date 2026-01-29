import { db } from '../database'

export default defineEventHandler(async () => {
  const waterTypes = await db
    .from('BFWaterTypes')
    .select({
      id: 'waterTypeId',
      name: db.raw(`NULLIF(waterTypeName, '')`),
    }) as {
    id: number
    name: string | null
  }[]

  const result: Record<string, string | null> = {}
  waterTypes.forEach((wt) => {
    result[`waterType${wt.id}`] = wt.name
  })

  return result
})
