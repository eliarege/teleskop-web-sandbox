import FTPClient from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  try {
    const tbb = new FTPClient('192.168.88.202')

    const outputs = await tbb.fetchDigitalOutputs()

    const digitalOutputs = outputs?.map(o => ({
      ...o,
      machineId,
    }))

    await knex('BFMACHDOUT').del()
    await knex('BFMACHDOUT').insert(digitalOutputs)

    return digitalOutputs
  } catch (err) {
    console.error(err)
  }
})
