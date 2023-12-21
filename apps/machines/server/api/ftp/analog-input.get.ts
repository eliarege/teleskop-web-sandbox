import FTPClient from 'tbb-ftp-client'
import { knex } from '~/server/connectionPool'

export default defineEventHandler(async (event) => {
  const { machineId } = getQuery(event)
  try {
    const tbb = new FTPClient('192.168.88.202')

    const inputs = await tbb.fetchAnalogInputs()
    const analogInputs = inputs?.map(i => ({
      ...i,
      machineId,
    }))

    await knex('BFMACHAIN').del()
    await knex('BFMACHAIN').insert(analogInputs)

    return analogInputs
  } catch (err) {
    console.error(err)
  }
})
