import { db } from '~/server/database'

export default defineEventHandler(async () => {
  return (await db('BAMASTERPRGHEADER')
    .distinct('PROGNO')
    .orderBy('PROGNO')).map(p => p.PROGNO)
})
