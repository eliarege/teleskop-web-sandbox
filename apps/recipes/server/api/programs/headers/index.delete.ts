import { dmsDB } from '~/server/connectionPool'
import type { ProgramHeader } from '~/shared/types'

export default defineEventHandler(async (event) => {
  const { program }: { program: ProgramHeader } = await readBody(event)
  const res = await dmsDB('PROGRAM_HEADER')
    .where('machine_id', program.machineId)
    .andWhere('program_no', program.programNo)
    .del()
  return res
})
