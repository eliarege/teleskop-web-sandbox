import FTPClient from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  try {
    const tbb = new FTPClient('192.168.88.202')

    const outputs = await tbb.fetchAnalogOutputs()
    const analogOutputs = outputs?.map(i => ({
      ...i,
      machineId,
    }))

    await knex('BFMACHAOUT').del()
    await knex('BFMACHAOUT').where('MACHINEID', machineId).insert(analogOutputs)

    return analogOutputs
  } catch (err) {
    console.error(err)
  }
})
