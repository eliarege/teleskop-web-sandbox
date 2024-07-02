import { TbbFtpClient } from '@teleskop/tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)

  const tbb = new TbbFtpClient('192.168.88.202')

  const locks = await tbb.fetchLocksGeneral()

  const generalLocks = locks?.map(l => ({
    ...l,
    machineId,
  }))

  await knex('BFLOCKSGENERAL').del()
  await knex('BFLOCKSGENERAL').insert(generalLocks)

  return generalLocks
})
