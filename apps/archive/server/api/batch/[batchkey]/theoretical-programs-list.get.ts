import { db } from '~/server/database'

export default defineEventHandler(async (event) => {
  const batchKey = getBatchKeyParam(event)
  let theoreticalPrograms = (await db('BADATA')
    .first('PROGRAMNOLIST')
    .where('BATCHKEY', batchKey)).PROGRAMNOLIST
  theoreticalPrograms = theoreticalPrograms.includes(',')
    ? theoreticalPrograms.split(',')
    : [theoreticalPrograms]
  return theoreticalPrograms.map((e) => {
    return { programNo: Number(e) }
  })
})
