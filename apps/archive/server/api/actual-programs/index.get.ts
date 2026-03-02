import { db } from '~/server/database'

export default defineEventHandler(async () => {
  return (await db('BAACTUALPRGSTEPS')
    .distinct('PRGNO')
    .orderBy('PRGNO')).map(p => p.PRGNO)
})
