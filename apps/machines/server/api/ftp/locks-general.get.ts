import FTPClient from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  try {
    const tbb = new FTPClient('192.168.88.202')

    const locks = await tbb.fetchLocksGeneral()

    const generalLocks = locks?.map(l => ({
      ...l,
      machineId,
    }))

    await knex('BFLOCKSGENERAL').del()
    await knex('BFLOCKSGENERAL').insert(generalLocks)

    return generalLocks
  } catch (err) {
    console.error(err)
  }
})
